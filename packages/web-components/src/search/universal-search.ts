import { ContentResult, ContentSearchResponse, ProductCategoryResult, ProductCategorySearchResponse, ProductResult, ProductSearchResponse, User } from '@relewise/client';
import { nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events, QueryKeys, getRelewiseUISearchOptions, readCurrentUrlState, updateUrlState } from '../helpers';
import { RelewiseLitElement } from '../relewise-lit-element';
import { renderUniversalSearchActiveTab } from './universal-search-active-tab';
import { getUniversalSearchTabLocalization } from './universal-search-localization';
import { getEnabledUniversalSearchTabs, getUniversalSearchPageSize } from './universal-search-options';
import { searchUniversalSearchTabs } from './universal-search-service';
import { universalSearchStyles } from './universal-search.styles';
import { universalSearchTabSettings } from './universal-search-tab-settings';
import { getNumberOfUniversalSearchResultsToFetch, updateUrlStateForUniversalSearchTerm } from './universal-search-url-state';
import { renderUniversalSearchView } from './universal-search-view';
import { UniversalSearchResponses, UniversalSearchResult, UniversalSearchTab, universalSearchTabs } from './universal-search.types';
import type { UniversalSearchServiceResult } from './universal-search-service';

export { universalSearchTabs };
export type { UniversalSearchTab };

export class UniversalSearch extends RelewiseLitElement {

    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string = undefined;

    @property({ type: String, attribute: 'target' })
    target: string | null = null;

    @property({ type: Boolean, reflect: true, attribute: 'open' })
    isOpen = false;

    @state()
    term: string = '';

    @state()
    activeTab: UniversalSearchTab | null = null;

    @state()
    productSearchResult: ProductSearchResponse | null = null;

    @state()
    productCategorySearchResult: ProductCategorySearchResponse | null = null;

    @state()
    contentSearchResult: ContentSearchResponse | null = null;

    @state()
    products: ProductResult[] = [];

    @state()
    productCategories: ProductCategoryResult[] = [];

    @state()
    content: ContentResult[] = [];

    @state()
    productPage: number = 1;

    @state()
    productCategoryPage: number = 1;

    @state()
    contentPage: number = 1;

    @state()
    loading: boolean = false;

    @state()
    error: string | null = null;

    @state()
    productFacetLabels: string[] = [];

    @state()
    productCategoryFacetLabels: string[] = [];

    @state()
    contentFacetLabels: string[] = [];

    @state()
    private user: User | null = null;

    @state()
    abortController: AbortController = new AbortController();

    private debounceTimeoutHandlerId: ReturnType<typeof setTimeout> | null = null;
    private handleWindowKeyDownBound = this.handleWindowKeyDown.bind(this);
    private onSearchOptionsChangedBound = this.onSearchOptionsChanged.bind(this);
    private defaultPageSize = 15;

    connectedCallback(): void {
        super.connectedCallback();
        this.term = readCurrentUrlState(QueryKeys.term) ?? '';
        this.activeTab = this.term ? this.firstEnabledTab : null;
        window.addEventListener('keydown', this.handleWindowKeyDownBound);
        window.addEventListener(Events.applyFacet, this.onSearchOptionsChangedBound);
        window.addEventListener(Events.applySorting, this.onSearchOptionsChangedBound);

        if (this.isOpen) {
            this.searchEnabledTabs(true);
        }
    }

    disconnectedCallback(): void {
        window.removeEventListener('keydown', this.handleWindowKeyDownBound);
        window.removeEventListener(Events.applyFacet, this.onSearchOptionsChangedBound);
        window.removeEventListener(Events.applySorting, this.onSearchOptionsChangedBound);
        super.disconnectedCallback();
    }

    open(): void {
        this.isOpen = true;
        this.searchEnabledTabs(true);
    }

    close(): void {
        this.abortController.abort();
        this.loading = false;
        this.isOpen = false;
    }

    setSearchTerm(term: string): void {
        if (this.term === term) {
            return;
        }

        this.term = term;
        this.abortController.abort();
        this.activeTab = this.term ? this.firstEnabledTab : null;
        this.clearAllResults();
        this.error = null;
        this.loading = Boolean(this.isOpen && this.term && this.enabledTabs.length > 0);

        if (this.debounceTimeoutHandlerId) {
            clearTimeout(this.debounceTimeoutHandlerId);
        }

        this.debounceTimeoutHandlerId = setTimeout(() => {
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

    private get firstEnabledTab(): UniversalSearchTab | null {
        return this.enabledTabs[0] ?? null;
    }

    private get productsPageSize(): number {
        return getUniversalSearchPageSize('products', this.defaultPageSize);
    }

    private get productCategoriesPageSize(): number {
        return getUniversalSearchPageSize('productCategories', this.defaultPageSize);
    }

    private get contentPageSize(): number {
        return getUniversalSearchPageSize('content', this.defaultPageSize);
    }

    handleKeyEvent(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            event.preventDefault();
            this.close();
        }
    }

    handleWindowKeyDown(event: KeyboardEvent): void {
        if (!this.isOpen || event.key !== 'Escape') {
            return;
        }

        event.preventDefault();
        this.close();
    }

    closeWhenClickingOutsideDialog(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.close();
        }
    }

    onSearchOptionsChanged(): void {
        if (!this.isOpen || !this.term || !this.activeTab) {
            return;
        }

        updateUrlState(universalSearchTabSettings[this.activeTab].takeQueryKey, null);

        this.searchTabs([this.activeTab], true);
    }

    handleSelectTab(tab: UniversalSearchTab): void {
        this.activeTab = tab;
    }

    handleLoadMoreActiveTab(): void {
        if (!this.activeTab) {
            return;
        }

        if (this.activeTab === 'products') {
            this.productPage = this.productPage + 1;
            updateUrlState(QueryKeys.productTake, (this.productsPageSize * this.productPage).toString());
        } else if (this.activeTab === 'productCategories') {
            this.productCategoryPage = this.productCategoryPage + 1;
            updateUrlState(QueryKeys.productCategoryTake, (this.productCategoriesPageSize * this.productCategoryPage).toString());
        } else {
            this.contentPage = this.contentPage + 1;
            updateUrlState(QueryKeys.contentTake, (this.contentPageSize * this.contentPage).toString());
        }

        this.searchTabs([this.activeTab], false);
    }

    searchEnabledTabs(shouldClearOldResult: boolean): Promise<void> {
        return this.searchTabs(this.enabledTabs, shouldClearOldResult);
    }

    async searchTabs(tabs: UniversalSearchTab[], shouldClearOldResult: boolean): Promise<void> {
        this.abortController.abort();

        if (!this.term || tabs.length === 0) {
            this.activeTab = null;
            this.clearAllResults();
            this.error = null;
            this.loading = false;
            return;
        }

        if (!this.activeTab || !this.enabledTabs.includes(this.activeTab)) {
            this.activeTab = this.firstEnabledTab;
        }

        const productsToFetch = getNumberOfUniversalSearchResultsToFetch('products');
        const productCategoriesToFetch = getNumberOfUniversalSearchResultsToFetch('productCategories');
        const contentToFetch = getNumberOfUniversalSearchResultsToFetch('content');
        this.loading = true;
        this.error = null;

        if (shouldClearOldResult) {
            this.resetPages(tabs, productsToFetch, productCategoriesToFetch, contentToFetch);
            this.clearResults(tabs);
        }

        const abortController = new AbortController();
        this.abortController = abortController;

        try {
            const searchResult = await searchUniversalSearchTabs({
                tabs,
                term: this.term,
                target: this.target,
                productsPage: this.productPage,
                productCategoriesPage: this.productCategoryPage,
                contentPage: this.contentPage,
                productsPageSize: this.productsPageSize,
                productCategoriesPageSize: this.productCategoriesPageSize,
                contentPageSize: this.contentPageSize,
                productsLoaded: this.products.length,
                productCategoriesLoaded: this.productCategories.length,
                contentLoaded: this.content.length,
                productsToFetch,
                productCategoriesToFetch,
                contentToFetch,
                displayedAtLocation: this.displayedAtLocation,
                abortSignal: abortController.signal,
            });

            this.user = searchResult.user;
            this.applyFacetLabels(tabs, searchResult);
            this.applySearchResponses(searchResult.responses);
        } catch (error) {
            if (!abortController.signal.aborted) {
                this.error = error instanceof Error ? error.message : this.activeLocalization?.error ?? 'Could not load results.';
            }
        } finally {
            if (!abortController.signal.aborted) {
                this.loading = false;
            }
        }
    }

    private applyFacetLabels(tabs: UniversalSearchTab[], searchResult: UniversalSearchServiceResult): void {
        if (tabs.includes('products')) {
            this.productFacetLabels = searchResult.productFacetLabels;
        }
        if (tabs.includes('productCategories')) {
            this.productCategoryFacetLabels = searchResult.productCategoryFacetLabels;
        }
        if (tabs.includes('content')) {
            this.contentFacetLabels = searchResult.contentFacetLabels;
        }
    }

    private applySearchResponses(responses: UniversalSearchResponses): void {
        if (responses.products) {
            this.productSearchResult = responses.products;
            this.products = this.products.concat(responses.products.results ?? []);
        }

        if (responses.productCategories) {
            this.productCategorySearchResult = responses.productCategories;
            this.productCategories = this.productCategories.concat(responses.productCategories.results ?? []);
        }

        if (responses.content) {
            this.contentSearchResult = responses.content;
            this.content = this.content.concat(responses.content.results ?? []);
        }
    }

    private resetPages(
        tabs: UniversalSearchTab[],
        productsToFetch: number | null,
        productCategoriesToFetch: number | null,
        contentToFetch: number | null,
    ): void {
        if (tabs.includes('products')) {
            this.productPage = productsToFetch ? productsToFetch / this.productsPageSize : 1;
        }
        if (tabs.includes('productCategories')) {
            this.productCategoryPage = productCategoriesToFetch ? productCategoriesToFetch / this.productCategoriesPageSize : 1;
        }
        if (tabs.includes('content')) {
            this.contentPage = contentToFetch ? contentToFetch / this.contentPageSize : 1;
        }
    }

    private clearAllResults(): void {
        this.clearResults([...universalSearchTabs]);
    }

    private clearResults(tabs: UniversalSearchTab[]): void {
        if (tabs.includes('products')) {
            this.products = [];
            this.productSearchResult = null;
        }
        if (tabs.includes('productCategories')) {
            this.productCategories = [];
            this.productCategorySearchResult = null;
        }
        if (tabs.includes('content')) {
            this.content = [];
            this.contentSearchResult = null;
        }
    }

    render() {
        if (!this.isOpen) {
            return nothing;
        }

        const tabs = this.enabledTabs;
        const activeTabContent = this.term && tabs.length > 0
            ? renderUniversalSearchActiveTab({
                activeTab: this.activeTab,
                productSearchResult: this.productSearchResult,
                productCategorySearchResult: this.productCategorySearchResult,
                contentSearchResult: this.contentSearchResult,
                products: this.products,
                productCategories: this.productCategories,
                content: this.content,
                productFacetLabels: this.productFacetLabels,
                productCategoryFacetLabels: this.productCategoryFacetLabels,
                contentFacetLabels: this.contentFacetLabels,
                loading: this.loading,
                error: this.error,
                user: this.user,
                target: this.target,
                onLoadMore: () => this.handleLoadMoreActiveTab(),
            })
            : nothing;

        return renderUniversalSearchView({
            term: this.term,
            tabs,
            activeTab: this.activeTab,
            tabResults: this.tabResults,
            activeTabContent,
            setSearchTerm: (term: string) => this.setSearchTerm(term),
            handleKeyEvent: (event: KeyboardEvent) => this.handleKeyEvent(event),
            close: () => this.close(),
            closeWhenClickingOutsideDialog: (event: MouseEvent) => this.closeWhenClickingOutsideDialog(event),
            selectTab: (tab: UniversalSearchTab) => this.handleSelectTab(tab),
        });
    }

    private get tabResults(): Record<UniversalSearchTab, UniversalSearchResult | null> {
        return {
            products: this.productSearchResult,
            productCategories: this.productCategorySearchResult,
            content: this.contentSearchResult,
        };
    }

    private get activeLocalization() {
        return getUniversalSearchTabLocalization(this.activeTab);
    }

    static styles = universalSearchStyles;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-universal-search': UniversalSearch;
    }
}
