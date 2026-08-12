import { SearchCollectionBuilder } from '@relewise/client';
import { html, nothing } from 'lit';
import type { PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { SearchSuggestionEntityType, UniversalSearchRecommendationBlock } from '../app';
import {
    QueryKeys,
    getRelewiseContextSettings,
    getRelewiseUIOptions,
    getRelewiseUISearchOptions,
    readCurrentUrlState,
} from '../helpers';
import { RelewiseLitElement } from '../relewise-lit-element';
import type { SearchCombobox } from './components/search-combobox';
import type { SearchComboboxTermEventDetail, SearchSuggestionsBatchSearch } from './components/search-combobox.types';
import { getSearcher } from './searcher';
import { trapFocusInDialog } from './universal-search-focus';
import { UniversalSearchRecommendationBlocksController } from './universal-search-recommendation-blocks';
import { universalSearchStyles } from './universal-search.styles';
import { updateUrlStateForUniversalSearchTerm } from './universal-search-url-state';
import { universalSearchTabs } from './universal-search.types';
import type { UniversalSearchBatchSearch, UniversalSearchBatchTab, UniversalSearchTab } from './universal-search.types';

export { universalSearchTabs };
export type { UniversalSearchTab };

let universalSearchInstanceId = 0;

const defaultTabLabels: Record<UniversalSearchTab, string> = {
    products: 'Products',
    productCategories: 'Categories',
    content: 'Content',
};

const defaultDisplayedAtLocation = 'Relewise Universal Search';

const suggestionEntityTypeByTab = {
    products: 'Product',
    productCategories: 'ProductCategory',
    content: 'Content',
} as const satisfies Record<UniversalSearchTab, SearchSuggestionEntityType>;

export class UniversalSearch extends RelewiseLitElement {

    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string = undefined;

    @property({ type: String, attribute: 'target' })
    target: string | null = null;

    @property({ type: Boolean, reflect: true, attribute: 'open' })
    isOpen = false;

    @state() private term = '';
    @state() private searchTerm = '';
    @state() private activeTab: UniversalSearchTab | null = null;
    @state() private tabHits: Record<UniversalSearchTab, number | null> = {
        products: null,
        productCategories: null,
        content: null,
    };

    private debounceTimeoutHandlerId: ReturnType<typeof setTimeout> | null = null;
    private batchAbortController = new AbortController();
    private handleWindowKeyDownBound = this.handleWindowKeyDown.bind(this);
    private readonly accessibilityId = `relewise-universal-search-${universalSearchInstanceId++}`;
    private previouslyFocusedElement: HTMLElement | null = null;
    private openStateActive = false;
    private activateTabAfterInitialSearch = false;
    private batchSearching = false;
    private readonly recommendationBlocks = new UniversalSearchRecommendationBlocksController(this, {
        getDisplayedAtLocation: () => this.displayedAtLocation ?? defaultDisplayedAtLocation,
        getTargetEntityTypes: () => this.enabledTabs.map(tab => suggestionEntityTypeByTab[tab]),
        selectSearchTerm: term => {
            this.setSearchTerm(term);
            this.submitCurrentTerm();
        },
    });

    connectedCallback(): void {
        super.connectedCallback();
        this.term = readCurrentUrlState(QueryKeys.term) ?? '';
        this.searchTerm = this.term;
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
        this.batchAbortController.abort();
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
            if (this.searchTerm) {
                void this.searchEnabledTabs(this.searchTerm);
            } else {
                void this.loadInitialRecommendations();
            }
            return;
        }

        this.batchAbortController.abort();
        this.recommendationBlocks.clearCache();
        this.previouslyFocusedElement?.focus();
        this.previouslyFocusedElement = null;
    }

    private readonly setSearchTerm = (term: string): void => {
        if (this.term === term) {
            return;
        }

        if (!this.term && term) {
            this.activateTabAfterInitialSearch = true;
        } else if (!term) {
            this.activateTabAfterInitialSearch = false;
        }

        this.term = term;
        this.batchAbortController.abort();
        this.recommendationBlocks.clearCache();
        this.searchTerm = '';
        this.activeTab = this.term ? this.activeTab ?? this.firstEnabledTab : null;
        this.tabHits = { products: null, productCategories: null, content: null };

        if (this.debounceTimeoutHandlerId) {
            clearTimeout(this.debounceTimeoutHandlerId);
        }

        this.debounceTimeoutHandlerId = setTimeout(() => {
            this.debounceTimeoutHandlerId = null;
            this.searchCurrentTerm();
        }, getRelewiseUISearchOptions()?.debounceTimeInMs);
    };

    private searchCurrentTerm(): void {
        updateUrlStateForUniversalSearchTerm(this.term);
        this.activeTab = this.term ? this.activeTab ?? this.firstEnabledTab : null;
        this.searchTerm = this.term;

        if (this.isOpen) {
            if (this.searchTerm) {
                void this.searchEnabledTabs(this.searchTerm);
            } else {
                void this.loadInitialRecommendations();
            }
        }
    }

    private submitCurrentTerm(): void {
        if (!this.debounceTimeoutHandlerId) {
            return;
        }

        clearTimeout(this.debounceTimeoutHandlerId);
        this.debounceTimeoutHandlerId = null;
        this.searchCurrentTerm();
    }

    private async searchEnabledTabs(term: string): Promise<void> {
        this.batchAbortController.abort();
        this.recommendationBlocks.clear();
        if (!term) {
            return;
        }

        if (this.enabledTabs.length === 0) {
            this.activateTabAfterInitialSearch = false;
            return;
        }

        const abortController = new AbortController();
        this.batchAbortController = abortController;

        await this.updateComplete;
        // Let runtime configuration register before the automatic search starts.
        await new Promise(resolve => setTimeout(resolve, 0));
        if (abortController.signal.aborted || this.searchTerm !== term) {
            return;
        }

        let searches: Array<UniversalSearchBatchSearch | SearchSuggestionsBatchSearch> = [];
        this.batchSearching = true;
        try {
            const settings = await getRelewiseContextSettings(this.displayedAtLocation ?? defaultDisplayedAtLocation);
            if (abortController.signal.aborted || this.searchTerm !== term) {
                return;
            }
            const tabs = [...this.renderRoot.querySelectorAll<UniversalSearchBatchTab & Element>(
                'relewise-universal-search-products-tab, relewise-universal-search-product-categories-tab, relewise-universal-search-content-tab',
            )];
            searches = tabs.map(tab => tab.prepareBatchSearch(settings));
            const suggestionsSearch = this.renderRoot
                .querySelector<SearchCombobox>('relewise-search-combobox')
                ?.prepareBatchSearch(settings);
            if (suggestionsSearch) {
                searches.push(suggestionsSearch);
            }
            const requestBuilder = new SearchCollectionBuilder();
            searches.forEach(search => requestBuilder.addRequest(search.request));
            const response = await getSearcher(getRelewiseUIOptions()).batch(requestBuilder.build(), { abortSignal: abortController.signal });
            if (abortController.signal.aborted) {
                return;
            }

            if (!response) {
                this.activateTabAfterInitialSearch = false;
                return;
            }

            searches.forEach(search => search.applyResponse(response));
            this.activateFirstResultTabFromInitialState();
            void this.loadNoResultRecommendations();
        } catch {
            if (!abortController.signal.aborted) {
                this.activateTabAfterInitialSearch = false;
                searches.forEach(search => search.setError());
                this.recommendationBlocks.clear();
            }
        } finally {
            if (this.batchAbortController === abortController) {
                this.batchSearching = false;
            }
        }
    }

    private get enabledTabs(): UniversalSearchTab[] {
        const entities = getRelewiseUISearchOptions()?.universalSearch?.entities;
        if (!entities) {
            return ['products'];
        }

        return Object.keys(entities)
            .filter((tab): tab is UniversalSearchTab => universalSearchTabs.includes(tab as UniversalSearchTab))
            .filter(tab => Boolean(entities[tab]));
    }

    private get firstEnabledTab(): UniversalSearchTab | null {
        return this.enabledTabs[0] ?? null;
    }

    private get visibleTabs(): UniversalSearchTab[] {
        const enabledTabs = this.enabledTabs;
        if (getRelewiseUISearchOptions()?.universalSearch?.behavior?.zeroResultTabs !== 'hide') {
            return enabledTabs;
        }

        return enabledTabs.filter(tab => this.tabHits[tab] !== 0 || tab === this.activeTab);
    }

    private get allEnabledTabsHaveZeroResults(): boolean {
        const enabledTabs = this.enabledTabs;
        return enabledTabs.length > 0 && enabledTabs.every(tab => this.tabHits[tab] === 0);
    }

    private get initialRecommendationBlocks() {
        return getRelewiseUISearchOptions()?.universalSearch?.recommendations?.initial ?? [];
    }

    private async loadInitialRecommendations(): Promise<void> {
        await this.recommendationBlocks.load(this.initialRecommendationBlocks, '', 'initial');
    }

    private activateFirstResultTabFromInitialState(): void {
        if (!this.activateTabAfterInitialSearch) {
            return;
        }

        this.activateTabAfterInitialSearch = false;
        if (getRelewiseUISearchOptions()?.universalSearch?.behavior?.activateFirstTabWithResultsFromInitialState === false) {
            return;
        }

        this.activeTab = this.enabledTabs.find(tab => (this.tabHits[tab] ?? 0) > 0) ?? this.activeTab;
    }

    private async loadNoResultRecommendations(): Promise<void> {
        const options = getRelewiseUISearchOptions()?.universalSearch;
        const noResults = options?.recommendations?.noResults;
        let blocks: UniversalSearchRecommendationBlock[] = [];
        let scope: UniversalSearchTab | 'global' | null = null;

        if (options?.behavior?.zeroResultTabs === 'hide' && this.allEnabledTabsHaveZeroResults) {
            blocks = noResults?.global ?? [];
            scope = 'global';
        } else if (options?.behavior?.zeroResultTabs !== 'hide' && this.activeTab && this.tabHits[this.activeTab] === 0) {
            blocks = noResults?.[this.activeTab] ?? [];
            scope = this.activeTab;
        }

        await this.recommendationBlocks.load(
            blocks,
            this.searchTerm,
            scope ? `no-results:${this.searchTerm}:${scope}` : undefined,
        );
    }

    private handleWindowKeyDown(event: KeyboardEvent): void {
        if (!this.isOpen || event.defaultPrevented || event.key !== 'Escape') {
            return;
        }

        event.preventDefault();
        this.close();
    }

    private closeWhenClickingOutsideDialog(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.close();
        }
    }

    private handleComboboxTermChanged(event: CustomEvent<SearchComboboxTermEventDetail>): void {
        this.setSearchTerm(event.detail.term);
    }

    private handleComboboxSearchSubmitted(): void {
        if (getRelewiseUISearchOptions()?.universalSearch?.suggestions) {
            this.submitCurrentTerm();
        }
    }

    private handleDialogKeyDown(event: KeyboardEvent): void {
        const dialog = this.renderRoot.querySelector<HTMLElement>('.rw-dialog');
        if (dialog) {
            trapFocusInDialog(event, dialog);
        }
    }

    private handleSelectTab(tab: UniversalSearchTab): void {
        this.activateTabAfterInitialSearch = false;
        this.activeTab = tab;
        void this.loadNoResultRecommendations();
    }

    private handleTabKeyDown(event: KeyboardEvent, tab: UniversalSearchTab): void {
        const tabs = this.visibleTabs;
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

    private handleTabStateChanged(event: CustomEvent<{ tab: UniversalSearchTab; hits: number | null }>): void {
        this.tabHits = {
            ...this.tabHits,
            [event.detail.tab]: event.detail.hits,
        };

        if (!this.batchSearching && event.detail.tab === this.activeTab) {
            void this.loadNoResultRecommendations();
        }
    }

    private getTabLabel(tab: UniversalSearchTab): string {
        return getRelewiseUISearchOptions()?.localization?.universalSearch?.[tab]?.tab ?? defaultTabLabels[tab];
    }

    private getResultsForLabel(tab: UniversalSearchTab): string {
        return getRelewiseUISearchOptions()?.localization?.universalSearch?.[tab]?.resultsFor ?? 'Search results for';
    }

    private getTabId(tab: UniversalSearchTab): string {
        return `${this.accessibilityId}-tab-${tab}`;
    }

    private getPanelId(tab: UniversalSearchTab): string {
        return `${this.accessibilityId}-panel-${tab}`;
    }

    render() {
        if (!this.isOpen) {
            return nothing;
        }

        const searchOptions = getRelewiseUISearchOptions();
        const localization = searchOptions?.localization;
        const searchBarLocalization = localization?.searchBar;
        const universalSearchLocalization = localization?.universalSearch;
        const enabledTabs = this.enabledTabs;
        const visibleTabs = this.visibleTabs;
        const zeroResultTabs = searchOptions?.universalSearch?.behavior?.zeroResultTabs;
        const showGlobalNoResults = zeroResultTabs === 'hide'
            && this.allEnabledTabsHaveZeroResults;
        const showActiveTabRecommendations = zeroResultTabs !== 'hide'
            && this.activeTab !== null
            && this.tabHits[this.activeTab] === 0;
        const hideActiveTabFacets = showActiveTabRecommendations && this.recommendationBlocks.hasResults;

        return html`
            <div
                class="rw-backdrop"
                part="backdrop"
                @click=${this.closeWhenClickingOutsideDialog}>
                <section
                    class="rw-dialog"
                    part="dialog"
                    role="dialog"
                    aria-modal="true"
                    tabindex="-1"
                    @keydown=${this.handleDialogKeyDown}
                    aria-label=${searchBarLocalization?.search ?? 'Search'}>
                    <header class="rw-header" part="header">
                        <relewise-search-combobox
                            part="search-bar"
                            exportparts="search-input, search-icon, search-suggestions, predictions, popular-search-terms, suggestions-list, suggestion, suggestion-icon"
                            .term=${this.term}
                            .suggestions=${searchOptions?.universalSearch?.suggestions}
                            .targetEntityTypes=${enabledTabs.map(tab => suggestionEntityTypeByTab[tab])}
                            .displayedAtLocation=${this.displayedAtLocation ?? defaultDisplayedAtLocation}
                            .placeholder=${searchBarLocalization?.placeholder ?? null}
                            @relewise-search-combobox-term-changed=${this.handleComboboxTermChanged}
                            @relewise-search-combobox-search-submitted=${this.handleComboboxSearchSubmitted}
                            @relewise-search-combobox-escape-requested=${this.close}
                            autofocus>
                        </relewise-search-combobox>
                        <relewise-button
                            class="rw-close"
                            part="close-button"
                            button-text=${universalSearchLocalization?.close ?? 'Close'}
                            @click=${this.close}>
                        </relewise-button>
                    </header>
                    <div
                        class="rw-body"
                        part="body"
                        @universal-search-tab-state-changed=${this.handleTabStateChanged}>
                        ${!this.term ? html`
                            ${this.recommendationBlocks.render()}
                            ${!this.recommendationBlocks.isLoading && !this.recommendationBlocks.hasResults ? html`
                                <p class="rw-empty" part="empty-state">
                                    ${universalSearchLocalization?.emptyState ?? 'Start typing to search.'}
                                </p>
                            ` : nothing}
                        ` : enabledTabs.length === 0 ? html`
                            <p class="rw-empty" part="empty-state">
                                ${universalSearchLocalization?.noEntitiesConfigured ?? 'No universal-search entities configured.'}
                            </p>
                        ` : html`
                            <div class="rw-results-summary" part="results-summary">
                                ${this.activeTab ? this.getResultsForLabel(this.activeTab) : 'Search results for'} <strong>${this.term}</strong>
                            </div>
                            ${showGlobalNoResults ? html`
                                <p class="rw-empty" part="zero-results">
                                    ${universalSearchLocalization?.noResults ?? 'No results found.'}
                                </p>
                                ${this.recommendationBlocks.render()}
                            ` : html`
                                <nav
                                    class="rw-tabs"
                                    part="tabs"
                                    role="tablist"
                                    aria-label=${universalSearchLocalization?.tabsLabel ?? 'Search result tabs'}>
                                    ${visibleTabs.map(tab => html`
                                        <button
                                            class="rw-tab"
                                            part="tab"
                                            type="button"
                                            id=${this.getTabId(tab)}
                                            role="tab"
                                            aria-controls=${this.getPanelId(tab)}
                                            aria-selected=${this.activeTab === tab}
                                            tabindex=${this.activeTab === tab ? 0 : -1}
                                            @keydown=${(event: KeyboardEvent) => this.handleTabKeyDown(event, tab)}
                                            @click=${() => this.handleSelectTab(tab)}>
                                            ${this.getTabLabel(tab)}
                                            ${this.tabHits[tab] !== null ? html`
                                                <span class="rw-tab-count" part="tab-count">${this.tabHits[tab]}</span>
                                            ` : nothing}
                                        </button>
                                    `)}
                                </nav>
                                ${visibleTabs.map(tab => html`
                                    <div
                                        id=${this.getPanelId(tab)}
                                        role="tabpanel"
                                        aria-labelledby=${this.getTabId(tab)}
                                        tabindex=${this.activeTab === tab ? 0 : -1}
                                        ?hidden=${this.activeTab !== tab}>
                                        ${tab === 'products' ? html`
                                            <relewise-universal-search-products-tab
                                                exportparts="results-layout, facets, facet-container, facet-title, facet-input, facet-label, facet-value, facet-hits, results, results-header, results-title, results-count, sorting, sorting-select, sorting-label, error-state, loading-state, zero-results, product-grid, product-tile, load-more"
                                                .term=${this.searchTerm}
                                                .target=${this.target}
                                                .hideFacets=${hideActiveTabFacets && this.activeTab === tab}
                                                .displayedAtLocation=${this.displayedAtLocation}>
                                            </relewise-universal-search-products-tab>
                                        ` : tab === 'productCategories' ? html`
                                            <relewise-universal-search-product-categories-tab
                                                exportparts="results-layout, facets, facet-container, facet-title, facet-input, facet-label, facet-value, facet-hits, results, results-header, results-title, results-count, error-state, loading-state, zero-results, category-grid, category-tile, load-more"
                                                .term=${this.searchTerm}
                                                .hideFacets=${hideActiveTabFacets && this.activeTab === tab}
                                                .displayedAtLocation=${this.displayedAtLocation}>
                                            </relewise-universal-search-product-categories-tab>
                                        ` : html`
                                            <relewise-universal-search-content-tab
                                                exportparts="results-layout, facets, facet-container, facet-title, facet-input, facet-label, facet-value, facet-hits, results, results-header, results-title, results-count, error-state, loading-state, zero-results, content-grid, content-tile, load-more"
                                                .term=${this.searchTerm}
                                                .hideFacets=${hideActiveTabFacets && this.activeTab === tab}
                                                .displayedAtLocation=${this.displayedAtLocation}>
                                            </relewise-universal-search-content-tab>
                                        `}
                                        ${showActiveTabRecommendations && this.activeTab === tab
                                            ? this.recommendationBlocks.render()
                                            : nothing}
                                    </div>
                                `)}
                            `}
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
