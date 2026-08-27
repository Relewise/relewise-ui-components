import { SearchCollectionBuilder } from '@relewise/client';
import type { ProductSearchResponse, RedirectResult, SearchResponseCollection } from '@relewise/client';
import { html, nothing } from 'lit';
import type { PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { SearchSuggestionEntityType } from '../../app';
import {
    QueryKeys,
    getRelewiseContextSettings,
    getRelewiseUIOptions,
    getRelewiseUISearchOptions,
    hasUrlStateWithPrefix,
    readCurrentUrlState,
} from '../../helpers';
import { RelewiseLitElement } from '../../relewise-lit-element';
import type { RecommendationStateChangedEventDetail } from '../../recommendations/recommendation-state';
import type { SearchCombobox } from '../components/search-combobox';
import type { SearchComboboxRedirectEventDetail, SearchComboboxTermEventDetail, SearchSuggestionsBatchSearch } from '../components/search-combobox.types';
import { canParseRedirectDestination } from '../../helpers/searchRedirect';
import { getSearcher } from '../searcher';
import type { UniversalSearchFacetsDrawerStateChangedEventDetail } from './components/facets';
import { universalSearchRecommendationsExportParts } from './components/recommendations';
import { trapFocusInDialog } from './universal-search-focus';
import { universalSearchStyles } from './universal-search.styles';
import { updateUrlStateForUniversalSearchTerm } from './universal-search-url-state';
import { universalSearchTabs } from './universal-search.types';
import type { UniversalSearchBatchSearch, UniversalSearchBatchTab, UniversalSearchTab } from './universal-search.types';

export { universalSearchTabs };
export type { UniversalSearchTab };

let universalSearchInstanceId = 0;
const openUniversalSearches = new Set<UniversalSearch>();
let documentElementOverflowBeforeLock = '';
let bodyOverflowBeforeLock = '';

function lockDocumentScrolling(instance: UniversalSearch): void {
    if (openUniversalSearches.has(instance)) {
        return;
    }

    if (openUniversalSearches.size === 0) {
        documentElementOverflowBeforeLock = document.documentElement.style.overflow;
        bodyOverflowBeforeLock = document.body.style.overflow;
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
    }

    openUniversalSearches.add(instance);
}

function unlockDocumentScrolling(instance: UniversalSearch): void {
    if (!openUniversalSearches.delete(instance) || openUniversalSearches.size > 0) {
        return;
    }

    document.documentElement.style.overflow = documentElementOverflowBeforeLock;
    document.body.style.overflow = bodyOverflowBeforeLock;
}

const defaultTabLabels: Record<UniversalSearchTab, string> = {
    products: 'Products',
    productCategories: 'Categories',
    content: 'Content',
};

const defaultDisplayedAtLocation = 'Relewise Universal Search';
const productSearchResponseType = 'Relewise.Client.Responses.Search.ProductSearchResponse, Relewise.Client';
const suggestionEntityTypeByTab = {
    products: 'Product',
    productCategories: 'ProductCategory',
    content: 'Content',
} as const satisfies Record<UniversalSearchTab, SearchSuggestionEntityType>;

const facetQueryKeyPrefixByTab = {
    products: QueryKeys.productFacet,
    productCategories: QueryKeys.productCategoryFacet,
    content: QueryKeys.contentFacet,
} as const satisfies Record<UniversalSearchTab, QueryKeys>;

const emptyRecommendationState: RecommendationStateChangedEventDetail = {
    hasResults: false,
    loading: false,
};

const loadingRecommendationState: RecommendationStateChangedEventDetail = {
    hasResults: false,
    loading: true,
};

export class UniversalSearch extends RelewiseLitElement {

    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string = undefined;

    @property({ type: String, attribute: 'target' })
    target: string | null = null;

    @property({ type: Boolean, reflect: true, attribute: 'open' })
    isOpen = false;

    @state() private term = '';
    @state() private redirects: RedirectResult[] = [];
    @state() private searchTerm = '';
    @state() private activeTab: UniversalSearchTab | null = null;
    @state() private tabHits: Record<UniversalSearchTab, number | null> = {
        products: null,
        productCategories: null,
        content: null,
    };

    @state() private initialRecommendationState = emptyRecommendationState;

    @state() private tabRecommendationStates: Record<UniversalSearchTab, RecommendationStateChangedEventDetail> = {
        products: emptyRecommendationState,
        productCategories: emptyRecommendationState,
        content: emptyRecommendationState,
    };

    @state() private batchSearching = false;
    @state() private facetsDrawerOpen = false;

    private debounceTimeoutHandlerId: ReturnType<typeof setTimeout> | null = null;
    private batchAbortController = new AbortController();
    private handleWindowKeyDownBound = this.handleWindowKeyDown.bind(this);
    private readonly accessibilityId = `relewise-universal-search-${universalSearchInstanceId++}`;
    private previouslyFocusedElement: HTMLElement | null = null;
    private openStateActive = false;

    connectedCallback(): void {
        super.connectedCallback();
        this.term = readCurrentUrlState(QueryKeys.term) ?? '';
        this.searchTerm = this.term;
        if (this.term) {
            this.isOpen = true;
        }
        this.activeTab = this.term ? this.firstEnabledTab : null;
        this.resetRecommendationState();
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
        unlockDocumentScrolling(this);
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
            lockDocumentScrolling(this);
            this.previouslyFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            if (this.searchTerm) {
                void this.searchEnabledTabs(this.searchTerm);
            }
            return;
        }

        unlockDocumentScrolling(this);
        this.batchAbortController.abort();
        this.facetsDrawerOpen = false;
        this.resetRecommendationState();
        this.previouslyFocusedElement?.focus();
        this.previouslyFocusedElement = null;
    }

    private readonly setSearchTerm = (term: string): void => {
        if (this.term === term) {
            return;
        }

        this.term = term;
        this.facetsDrawerOpen = false;
        this.redirects = [];
        this.batchAbortController.abort();
        this.resetRecommendationState();
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
        this.redirects = [];
        this.resetTabRecommendationState();
        if (!term) {
            return;
        }

        if (this.enabledTabs.length === 0) {
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
                searches.forEach(search => search.setError());
                return;
            }

            this.applyRedirects(response);
            searches.forEach(search => search.applyResponse(response));
            this.ensureActiveTabIsVisible();
            this.activateFirstTabWithResults();
        } catch {
            if (!abortController.signal.aborted) {
                searches.forEach(search => search.setError());
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

        return enabledTabs.filter(tab => this.tabHits[tab] !== 0 || this.tabHasSelectedFacets(tab));
    }

    private get allEnabledTabsHaveZeroResults(): boolean {
        const enabledTabs = this.enabledTabs;
        return enabledTabs.length > 0
            && enabledTabs.every(tab => this.tabHits[tab] === 0 && !this.tabHasSelectedFacets(tab));
    }

    private get initialRecommendations() {
        return getRelewiseUISearchOptions()?.universalSearch?.recommendations?.initial ?? [];
    }

    private get allTabsHiddenNoResultRecommendations() {
        return getRelewiseUISearchOptions()?.universalSearch?.recommendations?.noResults?.whenAllTabsAreHidden ?? [];
    }

    private getNoResultRecommendations(tab: UniversalSearchTab) {
        return getRelewiseUISearchOptions()?.universalSearch?.recommendations?.noResults?.[tab] ?? [];
    }

    private getNoResultRecommendationConfiguration(tab: UniversalSearchTab) {
        const configuration = this.getNoResultRecommendations(tab);
        return this.tabHits[tab] === 0 ? configuration : [];
    }

    private activateFirstTabWithResults(): void {
        if (getRelewiseUISearchOptions()?.universalSearch?.behavior?.activateFirstTabWithResults === false
            || this.activeTab === null
            || this.tabHits[this.activeTab] !== 0
            || this.tabHasSelectedFacets(this.activeTab)) {
            return;
        }

        this.activeTab = this.enabledTabs.find(tab => (this.tabHits[tab] ?? 0) > 0) ?? this.activeTab;
    }

    private ensureActiveTabIsVisible(): void {
        if (getRelewiseUISearchOptions()?.universalSearch?.behavior?.zeroResultTabs !== 'hide'
            || this.activeTab === null
            || this.tabHits[this.activeTab] !== 0
            || this.tabHasSelectedFacets(this.activeTab)) {
            return;
        }

        this.activeTab = this.visibleTabs[0] ?? this.activeTab;
    }

    private tabHasSelectedFacets(tab: UniversalSearchTab): boolean {
        return Boolean(readCurrentUrlState(QueryKeys.term))
            && hasUrlStateWithPrefix(facetQueryKeyPrefixByTab[tab]);
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
        const redirect = this.redirects[0];
        if (redirect?.destination) {
            window.location.href = redirect.destination;
            return;
        }

        if (getRelewiseUISearchOptions()?.universalSearch?.suggestions) {
            this.submitCurrentTerm();
        }
    }

    private handleComboboxRedirectSelected(event: CustomEvent<SearchComboboxRedirectEventDetail>): void {
        window.location.href = event.detail.destination;
    }

    private applyRedirects(response: SearchResponseCollection): void {
        const productResponse = response.responses?.find(item => '$type' in item
            && item.$type === productSearchResponseType) as ProductSearchResponse | undefined;
        this.redirects = productResponse?.redirects?.filter(redirect => canParseRedirectDestination(redirect.destination)) ?? [];
    }

    private handleDialogKeyDown(event: KeyboardEvent): void {
        const dialog = this.renderRoot.querySelector<HTMLElement>('.rw-dialog');
        if (dialog) {
            trapFocusInDialog(event, dialog);
        }
    }

    private handleSelectTab(tab: UniversalSearchTab): void {
        this.facetsDrawerOpen = false;
        this.activeTab = tab;
    }

    private handleFacetsDrawerStateChanged(event: CustomEvent<UniversalSearchFacetsDrawerStateChangedEventDetail>): void {
        this.facetsDrawerOpen = event.detail.open;
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
        this.tabRecommendationStates = {
            ...this.tabRecommendationStates,
            [event.detail.tab]: event.detail.hits === 0 && this.getNoResultRecommendations(event.detail.tab).length > 0
                ? loadingRecommendationState
                : emptyRecommendationState,
        };
        if (!this.batchSearching) {
            this.ensureActiveTabIsVisible();
        }
    }

    private handleInitialRecommendationStateChanged(event: CustomEvent<RecommendationStateChangedEventDetail>): void {
        this.initialRecommendationState = event.detail;
    }

    private handleTabRecommendationStateChanged(
        tab: UniversalSearchTab,
        event: CustomEvent<RecommendationStateChangedEventDetail>,
    ): void {
        this.tabRecommendationStates = {
            ...this.tabRecommendationStates,
            [tab]: event.detail,
        };
    }

    private handleRecommendationTermSelected(event: CustomEvent<{ term: string }>): void {
        this.setSearchTerm(event.detail.term);
        this.submitCurrentTerm();
    }

    private resetRecommendationState(): void {
        this.initialRecommendationState = !this.term && this.initialRecommendations.length > 0
            ? loadingRecommendationState
            : emptyRecommendationState;
        this.resetTabRecommendationState();
    }

    private resetTabRecommendationState(): void {
        this.tabRecommendationStates = {
            products: emptyRecommendationState,
            productCategories: emptyRecommendationState,
            content: emptyRecommendationState,
        };
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
        const noResultsHint = universalSearchLocalization?.noResultsHint ?? 'Try another search term or check the spelling.';
        const enabledTabs = this.enabledTabs;
        const visibleTabs = this.visibleTabs;
        const targetEntityTypes = enabledTabs.map(tab => suggestionEntityTypeByTab[tab]);
        const zeroResultTabs = searchOptions?.universalSearch?.behavior?.zeroResultTabs;
        const showAllTabsHiddenNoResults = zeroResultTabs === 'hide'
            && !this.batchSearching
            && this.allEnabledTabsHaveZeroResults;
        const showActiveTabRecommendations = zeroResultTabs !== 'hide'
            && !this.batchSearching
            && this.activeTab !== null
            && this.tabHits[this.activeTab] === 0;

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
                            exportparts="search-input, search-icon, clear-search, search-suggestions, predictions, popular-search-terms, suggestions-list, suggestion, suggestion-icon"
                            .term=${this.term}
                            .redirects=${this.redirects}
                            .suggestions=${searchOptions?.universalSearch?.suggestions}
                            .targetEntityTypes=${targetEntityTypes}
                            .displayedAtLocation=${this.displayedAtLocation ?? defaultDisplayedAtLocation}
                            .placeholder=${searchBarLocalization?.placeholder ?? null}
                            @relewise-search-combobox-term-changed=${this.handleComboboxTermChanged}
                            @relewise-search-combobox-search-submitted=${this.handleComboboxSearchSubmitted}
                            @relewise-search-combobox-redirect-selected=${this.handleComboboxRedirectSelected}
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
                        class=${this.facetsDrawerOpen ? 'rw-body rw-facets-open' : 'rw-body'}
                        part="body"
                        @universal-search-facets-drawer-state-changed=${this.handleFacetsDrawerStateChanged}
                        @universal-search-tab-state-changed=${this.handleTabStateChanged}>
                        ${!this.term ? html`
                            <relewise-universal-search-recommendations
                                exportparts=${universalSearchRecommendationsExportParts}
                                .configuration=${this.initialRecommendations}
                                .displayedAtLocation=${this.displayedAtLocation ?? defaultDisplayedAtLocation}
                                @relewise-ui-components:recommendation-state-changed=${this.handleInitialRecommendationStateChanged}
                                @relewise-ui-components:popular-search-term-selected=${this.handleRecommendationTermSelected}>
                            </relewise-universal-search-recommendations>
                            ${!this.initialRecommendationState.loading && !this.initialRecommendationState.hasResults ? html`
                                <p class="rw-empty" part="empty-state">
                                    ${universalSearchLocalization?.emptyState ?? 'Start typing to search.'}
                                </p>
                            ` : nothing}
                        ` : enabledTabs.length === 0 ? html`
                            <p class="rw-empty" part="empty-state">
                                ${universalSearchLocalization?.noEntitiesConfigured ?? 'No universal-search entities configured.'}
                            </p>
                        ` : html`
                            ${showAllTabsHiddenNoResults ? nothing : html`
                                <div class="rw-results-summary" part="results-summary">
                                    ${this.activeTab ? this.getResultsForLabel(this.activeTab) : 'Search results for'} <strong>${this.term}</strong>
                                </div>
                            `}
                            ${showAllTabsHiddenNoResults ? html`
                                <div class="rw-zero-results" part="zero-results" role="status">
                                    <span class="rw-zero-results-icon" part="zero-results-icon" aria-hidden="true">
                                        <relewise-search-icon></relewise-search-icon>
                                    </span>
                                    <div>
                                        <p class="rw-zero-results-title" part="zero-results-title">
                                            ${universalSearchLocalization?.noResults ?? html`No results found for <strong>${this.term}</strong>.`}
                                        </p>
                                        ${noResultsHint ? html`
                                            <p class="rw-zero-results-hint" part="zero-results-hint">
                                                ${noResultsHint}
                                            </p>
                                        ` : nothing}
                                    </div>
                                </div>
                                <relewise-universal-search-recommendations
                                    exportparts=${universalSearchRecommendationsExportParts}
                                    .configuration=${this.allTabsHiddenNoResultRecommendations}
                                    .term=${this.searchTerm}
                                    .displayedAtLocation=${this.displayedAtLocation ?? defaultDisplayedAtLocation}
                                    @relewise-ui-components:popular-search-term-selected=${this.handleRecommendationTermSelected}>
                                </relewise-universal-search-recommendations>
                            ` : html`
                                <nav
                                    class="rw-tabs"
                                    part="tabs"
                                    role="tablist"
                                    aria-label=${universalSearchLocalization?.tabsLabel ?? 'Search result tabs'}>
                                    ${repeat(visibleTabs, tab => tab, tab => html`
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
                                ${repeat(visibleTabs, tab => tab, tab => html`
                                    <div
                                        id=${this.getPanelId(tab)}
                                        role="tabpanel"
                                        aria-labelledby=${this.getTabId(tab)}
                                        tabindex=${this.activeTab === tab ? 0 : -1}
                                        ?hidden=${this.activeTab !== tab}>
                                        ${tab === 'products' ? html`
                                            <relewise-universal-search-products-tab
                                                exportparts="results-layout, facets, facet-trigger, facet-panel, facet-drawer, facet-drawer-backdrop, facet-drawer-header, facet-drawer-close, facet-container, facet-title, facet-input, facet-label, facet-value, facet-hits, results, results-header, results-title, results-count, sorting, sorting-container, sorting-select, sorting-label, error-state, loading-state, zero-results, zero-results-icon, zero-results-title, zero-results-hint, product-grid, product-tile, load-previous, load-more"
                                                .term=${this.searchTerm}
                                                .target=${this.target}
                                                .hideFacets=${showActiveTabRecommendations && this.activeTab === tab && this.tabRecommendationStates[tab].hasResults && !this.tabHasSelectedFacets(tab)}
                                                .noResultRecommendationConfiguration=${this.getNoResultRecommendationConfiguration(tab)}
                                                .noResultRecommendationsActive=${showActiveTabRecommendations && this.activeTab === tab}
                                                .displayedAtLocation=${this.displayedAtLocation}
                                                @relewise-ui-components:recommendation-state-changed=${(event: CustomEvent<RecommendationStateChangedEventDetail>) => this.handleTabRecommendationStateChanged(tab, event)}
                                                @relewise-ui-components:popular-search-term-selected=${this.handleRecommendationTermSelected}>
                                            </relewise-universal-search-products-tab>
                                        ` : tab === 'productCategories' ? html`
                                            <relewise-universal-search-product-categories-tab
                                                exportparts="results-layout, facets, facet-trigger, facet-panel, facet-drawer, facet-drawer-backdrop, facet-drawer-header, facet-drawer-close, facet-container, facet-title, facet-input, facet-label, facet-value, facet-hits, results, results-header, results-title, results-count, error-state, loading-state, zero-results, zero-results-icon, zero-results-title, zero-results-hint, category-grid, category-tile, load-more"
                                                .term=${this.searchTerm}
                                                .hideFacets=${showActiveTabRecommendations && this.activeTab === tab && this.tabRecommendationStates[tab].hasResults && !this.tabHasSelectedFacets(tab)}
                                                .noResultRecommendationConfiguration=${this.getNoResultRecommendationConfiguration(tab)}
                                                .noResultRecommendationsActive=${showActiveTabRecommendations && this.activeTab === tab}
                                                .displayedAtLocation=${this.displayedAtLocation}
                                                @relewise-ui-components:recommendation-state-changed=${(event: CustomEvent<RecommendationStateChangedEventDetail>) => this.handleTabRecommendationStateChanged(tab, event)}
                                                @relewise-ui-components:popular-search-term-selected=${this.handleRecommendationTermSelected}>
                                            </relewise-universal-search-product-categories-tab>
                                        ` : html`
                                            <relewise-universal-search-content-tab
                                                exportparts="results-layout, facets, facet-trigger, facet-panel, facet-drawer, facet-drawer-backdrop, facet-drawer-header, facet-drawer-close, facet-container, facet-title, facet-input, facet-label, facet-value, facet-hits, results, results-header, results-title, results-count, error-state, loading-state, zero-results, zero-results-icon, zero-results-title, zero-results-hint, content-grid, content-tile, load-more"
                                                .term=${this.searchTerm}
                                                .hideFacets=${showActiveTabRecommendations && this.activeTab === tab && this.tabRecommendationStates[tab].hasResults && !this.tabHasSelectedFacets(tab)}
                                                .noResultRecommendationConfiguration=${this.getNoResultRecommendationConfiguration(tab)}
                                                .noResultRecommendationsActive=${showActiveTabRecommendations && this.activeTab === tab}
                                                .displayedAtLocation=${this.displayedAtLocation}
                                                @relewise-ui-components:recommendation-state-changed=${(event: CustomEvent<RecommendationStateChangedEventDetail>) => this.handleTabRecommendationStateChanged(tab, event)}
                                                @relewise-ui-components:popular-search-term-selected=${this.handleRecommendationTermSelected}>
                                            </relewise-universal-search-content-tab>
                                        `}
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
