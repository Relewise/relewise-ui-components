import { User } from '@relewise/client';
import { nothing } from 'lit';
import type { PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { QueryKeys, getRelewiseUISearchOptions, readCurrentUrlState, updateUrlState } from '../helpers';
import { RelewiseLitElement } from '../relewise-lit-element';
import { createUniversalSearchEntities } from './universal-search-entity-registry';
import type { UniversalSearchEntity } from './universal-search-entity-registry';
import { trapFocusInDialog } from './universal-search-focus';
import { getEnabledUniversalSearchTabs } from './universal-search-options';
import { searchUniversalSearchEntities } from './universal-search-service';
import { universalSearchStyles } from './universal-search.styles';
import { universalSearchTabSettings } from './universal-search-tab-settings';
import { updateUrlStateForUniversalSearchTerm } from './universal-search-url-state';
import { renderUniversalSearchView } from './universal-search-view';
import { UniversalSearchTab, universalSearchTabs } from './universal-search.types';

export { universalSearchTabs };
export type { UniversalSearchTab };

let universalSearchInstanceId = 0;

export class UniversalSearch extends RelewiseLitElement {

    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string = undefined;

    @property({ type: String, attribute: 'target' })
    target: string | null = null;

    @property({ type: Boolean, reflect: true, attribute: 'open' })
    isOpen = false;

    @state()
    private term: string = '';

    @state()
    private activeTab: UniversalSearchTab | null = null;

    @state()
    private loading: boolean = false;

    @state()
    private user: User | null = null;

    private abortController: AbortController = new AbortController();

    private debounceTimeoutHandlerId: ReturnType<typeof setTimeout> | null = null;
    private handleWindowKeyDownBound = this.handleWindowKeyDown.bind(this);
    private readonly defaultPageSize = 15;
    private readonly entities = createUniversalSearchEntities(this.defaultPageSize, () => this.requestUpdate());
    private readonly accessibilityId = `relewise-universal-search-${universalSearchInstanceId++}`;
    private previouslyFocusedElement: HTMLElement | null = null;
    private openStateActive = false;

    connectedCallback(): void {
        super.connectedCallback();
        this.term = readCurrentUrlState(QueryKeys.term) ?? '';
        this.activeTab = this.term ? this.firstEnabledTab : null;
        window.addEventListener('keydown', this.handleWindowKeyDownBound);
        this.syncOpenState();
    }

    disconnectedCallback(): void {
        window.removeEventListener('keydown', this.handleWindowKeyDownBound);
        if (this.debounceTimeoutHandlerId) {
            clearTimeout(this.debounceTimeoutHandlerId);
            this.debounceTimeoutHandlerId = null;
        }
        this.abortController.abort();
        this.openStateActive = false;
        this.previouslyFocusedElement = null;
        super.disconnectedCallback();
    }

    protected willUpdate(changedProperties: PropertyValues<this>): void {
        if (changedProperties.has('isOpen')) {
            this.syncOpenState();
        }
    }

    open(): void {
        this.isOpen = true;
        this.syncOpenState();
    }

    close(): void {
        this.isOpen = false;
        this.syncOpenState();
    }

    private syncOpenState(): void {
        if (!this.isConnected || this.openStateActive === this.isOpen) {
            return;
        }

        this.openStateActive = this.isOpen;
        if (this.isOpen) {
            this.previouslyFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            this.searchEnabledTabs(true);
            return;
        }

        this.abortController.abort();
        this.loading = false;
        this.previouslyFocusedElement?.focus();
        this.previouslyFocusedElement = null;
    }

    private setSearchTerm(term: string): void {
        if (this.term === term) {
            return;
        }

        this.term = term;
        this.abortController.abort();
        this.activeTab = this.term ? this.firstEnabledTab : null;
        this.clearAllResults();
        this.clearErrors([...universalSearchTabs]);
        this.loading = Boolean(this.isOpen && this.term && this.enabledTabs.length > 0);

        if (this.debounceTimeoutHandlerId) {
            clearTimeout(this.debounceTimeoutHandlerId);
        }

        this.debounceTimeoutHandlerId = setTimeout(() => {
            this.debounceTimeoutHandlerId = null;
            updateUrlStateForUniversalSearchTerm(this.term);
            this.activeTab = this.term ? this.firstEnabledTab : null;
            if (this.isOpen) {
                this.searchEnabledTabs(true);
            }
        }, getRelewiseUISearchOptions()?.debounceTimeInMs);
    }

    private get enabledTabs(): UniversalSearchTab[] {
        return getEnabledUniversalSearchTabs();
    }

    private get enabledEntities() {
        return this.enabledTabs.map(tab => this.entities[tab]);
    }

    private get firstEnabledTab(): UniversalSearchTab | null {
        return this.enabledTabs[0] ?? null;
    }

    private handleKeyEvent(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            event.preventDefault();
            this.close();
        }
    }

    private handleWindowKeyDown(event: KeyboardEvent): void {
        if (!this.isOpen || event.key !== 'Escape') {
            return;
        }

        event.preventDefault();
        this.close();
    }

    private handleDialogKeyDown(event: KeyboardEvent): void {
        const dialog = this.renderRoot.querySelector<HTMLElement>('.rw-dialog');
        if (!dialog) {
            return;
        }
        trapFocusInDialog(event, dialog);
    }

    private closeWhenClickingOutsideDialog(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.close();
        }
    }

    private onSearchOptionsChanged(): void {
        if (!this.isOpen || !this.term || !this.activeTab) {
            return;
        }

        updateUrlState(universalSearchTabSettings[this.activeTab].takeQueryKey, null);

        this.searchTabs([this.activeTab], true);
    }

    private handleSelectTab(tab: UniversalSearchTab): void {
        this.activeTab = tab;
    }

    private async handleLoadMoreActiveTab(): Promise<void> {
        if (!this.activeTab || this.loading) {
            return;
        }

        const tab = this.activeTab;
        const previousPage = this.getPage(tab);
        const requestedPage = previousPage + 1;
        this.setPage(tab, requestedPage);

        const succeeded = await this.searchTabs([tab], false);
        if (!succeeded) {
            if (this.getPage(tab) === requestedPage) {
                this.setPage(tab, previousPage);
            }
            return;
        }

        if (this.getPage(tab) === requestedPage) {
            updateUrlState(universalSearchTabSettings[tab].takeQueryKey, (this.getPageSize(tab) * requestedPage).toString());
        }
    }

    private async searchEnabledTabs(shouldClearOldResult: boolean): Promise<void> {
        await this.searchTabs(this.enabledTabs, shouldClearOldResult);
    }

    private async searchTabs(tabs: UniversalSearchTab[], shouldClearOldResult: boolean): Promise<boolean> {
        this.abortController.abort();

        if (!this.term || tabs.length === 0) {
            this.activeTab = null;
            this.forEachEntity(universalSearchTabs, entity => {
                entity.clear();
                entity.clearError();
            });
            this.loading = false;
            return false;
        }

        if (!this.activeTab || !this.enabledTabs.includes(this.activeTab)) {
            this.activeTab = this.firstEnabledTab;
        }

        this.loading = true;
        this.forEachEntity(tabs, entity => entity.clearError());

        if (shouldClearOldResult) {
            this.forEachEntity(tabs, entity => entity.resetForSearch());
        }

        const abortController = new AbortController();
        this.abortController = abortController;

        try {
            const searchResult = await searchUniversalSearchEntities({
                entities: tabs.map(tab => this.entities[tab]),
                term: this.term,
                target: this.target,
                displayedAtLocation: this.displayedAtLocation,
                abortSignal: abortController.signal,
            });

            if (abortController.signal.aborted) {
                return false;
            }

            this.user = searchResult.user;
            return true;
        } catch {
            if (!abortController.signal.aborted) {
                this.forEachEntity(tabs, entity => entity.setError());
            }
            return false;
        } finally {
            if (!abortController.signal.aborted) {
                this.loading = false;
            }
        }
    }

    private clearAllResults(): void {
        this.forEachEntity(universalSearchTabs, entity => entity.clear());
    }

    private clearErrors(tabs: UniversalSearchTab[]): void {
        this.forEachEntity(tabs, entity => entity.clearError());
    }

    private getPage(tab: UniversalSearchTab): number {
        return this.entities[tab].page;
    }

    private setPage(tab: UniversalSearchTab, page: number): void {
        this.entities[tab].setPage(page);
    }

    private getPageSize(tab: UniversalSearchTab): number {
        return this.entities[tab].pageSize;
    }

    private forEachEntity(tabs: readonly UniversalSearchTab[], callback: (entity: UniversalSearchEntity) => void): void {
        tabs.forEach(tab => callback(this.entities[tab]));
    }

    render() {
        if (!this.isOpen) {
            return nothing;
        }

        const entities = this.enabledEntities;
        const activeEntity = entities.find(entity => entity.id === this.activeTab);
        const activeTabContent = this.term && activeEntity
            ? activeEntity.render({
                loading: this.loading,
                user: this.user,
                target: this.target,
                onLoadMore: () => this.handleLoadMoreActiveTab(),
                onSearchOptionsChanged: () => this.onSearchOptionsChanged(),
            })
            : nothing;

        return renderUniversalSearchView({
            term: this.term,
            entities,
            activeTab: this.activeTab,
            activeTabContent,
            activeTabContentKey: `${this.activeTab ?? 'none'}:${this.term}`,
            accessibilityId: this.accessibilityId,
            setSearchTerm: (term: string) => this.setSearchTerm(term),
            handleKeyEvent: (event: KeyboardEvent) => this.handleKeyEvent(event),
            close: () => this.close(),
            closeWhenClickingOutsideDialog: (event: MouseEvent) => this.closeWhenClickingOutsideDialog(event),
            handleDialogKeyDown: (event: KeyboardEvent) => this.handleDialogKeyDown(event),
            selectTab: (tab: UniversalSearchTab) => this.handleSelectTab(tab),
        });
    }

    static styles = universalSearchStyles;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-universal-search': UniversalSearch;
    }
}
