import { User } from '@relewise/client';
import { html, nothing } from 'lit';
import type { PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { QueryKeys, getRelewiseUISearchOptions, readCurrentUrlState, updateUrlState } from '../helpers';
import { RelewiseLitElement } from '../relewise-lit-element';
import { UniversalSearchContentEntity } from './universal-search-content-entity';
import type { UniversalSearchEntity } from './universal-search-entity';
import { trapFocusInDialog } from './universal-search-focus';
import { getEnabledUniversalSearchTabs } from './universal-search-options';
import { UniversalSearchProductCategoriesEntity } from './universal-search-product-categories-entity';
import { UniversalSearchProductsEntity } from './universal-search-products-entity';
import { searchUniversalSearchEntities } from './universal-search-service';
import { universalSearchStyles } from './universal-search.styles';
import { UniversalSearchTabId, getUniversalSearchTabQueryKeys } from './universal-search-tab-settings';
import { updateUrlStateForUniversalSearchTerm } from './universal-search-url-state';
import { UniversalSearchTab, universalSearchTabs } from './universal-search.types';

export { universalSearchTabs };
export type { UniversalSearchTab };

let universalSearchInstanceId = 0;
const defaultPageSize = 15;

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
    private readonly entityStateChanged = () => this.entities = { ...this.entities };

    @state()
    private entities = {
        [UniversalSearchTabId.products]: new UniversalSearchProductsEntity(defaultPageSize, this.entityStateChanged),
        [UniversalSearchTabId.productCategories]: new UniversalSearchProductCategoriesEntity(defaultPageSize, this.entityStateChanged),
        [UniversalSearchTabId.content]: new UniversalSearchContentEntity(defaultPageSize, this.entityStateChanged),
    } satisfies Record<UniversalSearchTab, UniversalSearchEntity>;

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

    private readonly setSearchTerm = (term: string): void => {
        if (this.term === term) {
            return;
        }

        this.term = term;
        this.abortController.abort();
        this.activeTab = this.term ? this.firstEnabledTab : null;
        this.forEachEntity(universalSearchTabs, entity => entity.clear());
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
    };

    private get enabledTabs(): UniversalSearchTab[] {
        return getEnabledUniversalSearchTabs();
    }

    private get enabledEntities() {
        return this.enabledTabs.map(tab => this.entities[tab]);
    }

    private get firstEnabledTab(): UniversalSearchTab | null {
        return this.enabledTabs[0] ?? null;
    }

    private handleWindowKeyDown(event: KeyboardEvent): void {
        if (!this.isOpen || event.key !== 'Escape') {
            return;
        }

        event.preventDefault();
        this.close();
    }

    private readonly handleSearchBarKeyDown = (event: KeyboardEvent): void => {
        if (event.key === 'Escape') {
            event.preventDefault();
            this.close();
        }
    };

    private closeWhenClickingOutsideDialog(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.close();
        }
    }

    private handleDialogKeyDown(event: KeyboardEvent): void {
        const dialog = this.renderRoot.querySelector<HTMLElement>('.rw-dialog');
        if (dialog) {
            trapFocusInDialog(event, dialog);
        }
    }

    private onSearchOptionsChanged(): void {
        if (!this.isOpen || !this.term || !this.activeTab) {
            return;
        }

        updateUrlState(getUniversalSearchTabQueryKeys(this.activeTab).take, null);
        this.searchTabs([this.activeTab], true);
    }

    private handleSelectTab(tab: UniversalSearchTab): void {
        this.activeTab = tab;
    }

    private handleTabKeyDown(event: KeyboardEvent, tab: UniversalSearchTab): void {
        const tabs = this.enabledTabs;
        const currentIndex = tabs.indexOf(tab);
        let nextIndex: number | null = null;

        if (event.key === 'ArrowRight') {
            nextIndex = (currentIndex + 1) % tabs.length;
        } else if (event.key === 'ArrowLeft') {
            nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        } else if (event.key === 'Home') {
            nextIndex = 0;
        } else if (event.key === 'End') {
            nextIndex = tabs.length - 1;
        }

        if (nextIndex === null) {
            return;
        }

        event.preventDefault();
        const nextTab = tabs[nextIndex];
        this.handleSelectTab(nextTab);
        this.renderRoot.querySelector<HTMLElement>(`#${this.getTabId(nextTab)}`)?.focus();
    }

    private getTabId(tab: UniversalSearchTab): string {
        return `${this.accessibilityId}-tab-${tab}`;
    }

    private getPanelId(tab: UniversalSearchTab): string {
        return `${this.accessibilityId}-panel-${tab}`;
    }

    private async handleLoadMoreActiveTab(): Promise<void> {
        if (!this.activeTab || this.loading) {
            return;
        }

        const tab = this.activeTab;
        await this.entities[tab].loadMore(() => this.searchTabs([tab], false));
    }

    private async searchEnabledTabs(shouldClearOldResult: boolean): Promise<void> {
        await this.searchTabs(this.enabledTabs, shouldClearOldResult);
    }

    private async searchTabs(tabs: UniversalSearchTab[], shouldClearOldResult: boolean): Promise<boolean> {
        this.abortController.abort();

        if (!this.term || tabs.length === 0) {
            this.activeTab = null;
            this.forEachEntity(universalSearchTabs, entity => entity.clear());
            this.loading = false;
            return false;
        }

        if (!this.activeTab || !this.enabledTabs.includes(this.activeTab)) {
            this.activeTab = this.firstEnabledTab;
        }

        this.loading = true;
        if (shouldClearOldResult) {
            this.forEachEntity(tabs, entity => entity.resetForSearch());
        } else {
            this.forEachEntity(tabs, entity => entity.clearError());
        }

        const abortController = new AbortController();
        this.abortController = abortController;

        try {
            const user = await searchUniversalSearchEntities({
                entities: tabs.map(tab => this.entities[tab]),
                term: this.term,
                target: this.target,
                displayedAtLocation: this.displayedAtLocation,
                abortSignal: abortController.signal,
            });

            if (abortController.signal.aborted) {
                return false;
            }

            this.user = user;
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

    private forEachEntity(tabs: readonly UniversalSearchTab[], callback: (entity: UniversalSearchEntity) => void): void {
        tabs.forEach(tab => callback(this.entities[tab]));
    }

    render() {
        if (!this.isOpen) {
            return nothing;
        }

        const localization = getRelewiseUISearchOptions()?.localization;
        const searchBarLocalization = localization?.searchBar;
        const universalSearchLocalization = localization?.universalSearch;
        const enabledEntities = this.enabledEntities;
        const activeEntity = this.activeTab ? this.entities[this.activeTab] : null;

        return html`
            <div class="rw-backdrop" part="backdrop" @click=${this.closeWhenClickingOutsideDialog}>
                <section
                    class="rw-dialog"
                    part="dialog"
                    role="dialog"
                    aria-modal="true"
                    tabindex="-1"
                    @keydown=${this.handleDialogKeyDown}
                    aria-label=${searchBarLocalization?.search ?? 'Search'}>
                    <header class="rw-header" part="header">
                        <relewise-search-bar
                            part="search-bar"
                            exportparts="input: search-input, icon: search-icon"
                            .term=${this.term}
                            .setSearchTerm=${this.setSearchTerm}
                            .handleKeyEvent=${this.handleSearchBarKeyDown}
                            .placeholder=${searchBarLocalization?.placeholder ?? null}
                            autofocus>
                        </relewise-search-bar>
                        <relewise-button
                            class="rw-close"
                            part="close-button"
                            button-text=${universalSearchLocalization?.close ?? 'Close'}
                            @click=${this.close}>
                        </relewise-button>
                    </header>
                    <div class="rw-body" part="body">
                        ${!this.term ? html`
                            <p class="rw-empty" part="empty-state">
                                ${universalSearchLocalization?.emptyState ?? 'Start typing to search.'}
                            </p>
                        ` : enabledEntities.length === 0 ? html`
                            <p class="rw-empty" part="empty-state">
                                ${universalSearchLocalization?.noEntitiesConfigured ?? 'No universal-search entities configured.'}
                            </p>
                        ` : html`
                            <div class="rw-results-summary" part="results-summary">
                                ${activeEntity?.resultsForLabel ?? 'Search results for'} <strong>${this.term}</strong>
                            </div>
                            <nav
                                class="rw-tabs"
                                part="tabs"
                                role="tablist"
                                aria-label=${universalSearchLocalization?.tabsLabel ?? 'Search result tabs'}>
                                ${enabledEntities.map(entity => html`
                                    <button
                                        class="rw-tab"
                                        part="tab"
                                        type="button"
                                        id=${this.getTabId(entity.id)}
                                        role="tab"
                                        aria-controls=${this.getPanelId(entity.id)}
                                        aria-selected=${this.activeTab === entity.id}
                                        tabindex=${this.activeTab === entity.id ? 0 : -1}
                                        @keydown=${(event: KeyboardEvent) => this.handleTabKeyDown(event, entity.id)}
                                        @click=${() => this.handleSelectTab(entity.id)}>
                                        ${entity.tabLabel}
                                        ${entity.response ? html`
                                            <span class="rw-tab-count" part="tab-count">${entity.response.hits}</span>
                                        ` : nothing}
                                    </button>
                                `)}
                            </nav>
                            ${this.activeTab ? html`
                                <div
                                    id=${this.getPanelId(this.activeTab)}
                                    role="tabpanel"
                                    aria-labelledby=${this.getTabId(this.activeTab)}
                                    tabindex="0">
                                    ${this.activeTab === UniversalSearchTabId.products ? html`
                                        <relewise-universal-search-products-tab
                                            exportparts="results-layout, facets, facet-container, facet-title, facet-input, facet-label, facet-value, facet-hits, results, results-header, results-title, results-count, sorting, sorting-select, sorting-label, error-state, loading-state, zero-results, product-grid, product-tile, load-more"
                                            .result=${this.entities.products.response}
                                            .products=${this.entities.products.results}
                                            .facetLabels=${this.entities.products.facetLabels}
                                            .loading=${this.loading}
                                            .error=${this.entities.products.error}
                                            .user=${this.user}
                                            .target=${this.target}
                                            @universal-search-load-more=${this.handleLoadMoreActiveTab}
                                            @universal-search-options-changed=${this.onSearchOptionsChanged}>
                                        </relewise-universal-search-products-tab>
                                    ` : this.activeTab === UniversalSearchTabId.productCategories ? html`
                                        <relewise-universal-search-product-categories-tab
                                            exportparts="results-layout, facets, facet-container, facet-title, facet-input, facet-label, facet-value, facet-hits, results, results-header, results-title, results-count, error-state, loading-state, zero-results, category-grid, category-tile, load-more"
                                            .result=${this.entities.productCategories.response}
                                            .productCategories=${this.entities.productCategories.results}
                                            .facetLabels=${this.entities.productCategories.facetLabels}
                                            .loading=${this.loading}
                                            .error=${this.entities.productCategories.error}
                                            .user=${this.user}
                                            @universal-search-load-more=${this.handleLoadMoreActiveTab}
                                            @universal-search-options-changed=${this.onSearchOptionsChanged}>
                                        </relewise-universal-search-product-categories-tab>
                                    ` : html`
                                        <relewise-universal-search-content-tab
                                            exportparts="results-layout, facets, facet-container, facet-title, facet-input, facet-label, facet-value, facet-hits, results, results-header, results-title, results-count, error-state, loading-state, zero-results, content-grid, content-tile, load-more"
                                            .result=${this.entities.content.response}
                                            .content=${this.entities.content.results}
                                            .facetLabels=${this.entities.content.facetLabels}
                                            .loading=${this.loading}
                                            .error=${this.entities.content.error}
                                            .user=${this.user}
                                            @universal-search-load-more=${this.handleLoadMoreActiveTab}
                                            @universal-search-options-changed=${this.onSearchOptionsChanged}>
                                        </relewise-universal-search-content-tab>
                                    `}
                                </div>
                            ` : nothing}
                        `}
                    </div>
                </section>
            </div>
        `;
    }

    static styles = universalSearchStyles;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-universal-search': UniversalSearch;
    }
}
