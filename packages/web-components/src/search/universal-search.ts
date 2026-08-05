import { ContentResult, ContentSearchResponse, ProductCategoryResult, ProductCategorySearchResponse, ProductResult, ProductSearchResponse, SearchCollectionBuilder, SearchResponseCollection, User } from '@relewise/client';
import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { createProductCategorySearchBuilder } from '../builders';
import { Events, QueryKeys, getRelewiseUISearchOptions, readCurrentUrlState, updateUrlState } from '../helpers';
import { getRelewiseContextSettings, getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { RelewiseLitElement } from '../relewise-lit-element';
import { buildContentSearchRequest } from './contentSearchRequestBuilder';
import { buildProductSearchRequest } from './productSearchRequestBuilder';
import { getSearcher } from './searcher';
import { universalSearchStyles } from './universal-search.styles';

export type UniversalSearchTab = 'products' | 'productCategories' | 'content';

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
    contentFacetLabels: string[] = [];

    @state()
    private user: User | null = null;

    @state()
    abortController: AbortController = new AbortController();

    private debounceTimeoutHandlerId: ReturnType<typeof setTimeout> | null = null;
    private handleWindowKeyDownBound = this.handleWindowKeyDown.bind(this);
    private handleSearchConfigurationChangedBound = this.handleSearchConfigurationChanged.bind(this);
    private defaultPageSize = 15;

    connectedCallback(): void {
        super.connectedCallback();
        this.term = readCurrentUrlState(QueryKeys.term) ?? '';
        this.activeTab = this.term ? this.firstEnabledTab : null;
        window.addEventListener('keydown', this.handleWindowKeyDownBound);
        window.addEventListener(Events.applyFacet, this.handleSearchConfigurationChangedBound);
        window.addEventListener(Events.applySorting, this.handleSearchConfigurationChangedBound);

        if (this.isOpen) {
            this.searchEnabledTabs(true);
        }
    }

    disconnectedCallback(): void {
        window.removeEventListener('keydown', this.handleWindowKeyDownBound);
        window.removeEventListener(Events.applyFacet, this.handleSearchConfigurationChangedBound);
        window.removeEventListener(Events.applySorting, this.handleSearchConfigurationChangedBound);
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
            this.updateUrlStateForSearchTerm();
            this.activeTab = this.term ? this.firstEnabledTab : null;
            if (this.isOpen) {
                this.searchEnabledTabs(true);
            }
        }, getRelewiseUISearchOptions()?.debounceTimeInMs);
    }

    private get productsTabEnabled(): boolean {
        return Boolean(getRelewiseUISearchOptions()?.universalSearch?.entities?.products);
    }

    private get productCategoriesTabEnabled(): boolean {
        return Boolean(getRelewiseUISearchOptions()?.universalSearch?.entities?.productCategories);
    }

    private get contentTabEnabled(): boolean {
        return Boolean(getRelewiseUISearchOptions()?.universalSearch?.entities?.content);
    }

    private get enabledTabs(): UniversalSearchTab[] {
        const tabs: UniversalSearchTab[] = [];
        if (this.productsTabEnabled) tabs.push('products');
        if (this.productCategoriesTabEnabled) tabs.push('productCategories');
        if (this.contentTabEnabled) tabs.push('content');
        return tabs;
    }

    private get firstEnabledTab(): UniversalSearchTab | null {
        return this.enabledTabs[0] ?? null;
    }

    private get productsPageSize(): number {
        return getRelewiseUISearchOptions()?.universalSearch?.entities?.products?.pageSize ?? this.defaultPageSize;
    }

    private get productCategoriesPageSize(): number {
        return getRelewiseUISearchOptions()?.universalSearch?.entities?.productCategories?.pageSize ?? this.defaultPageSize;
    }

    private get contentPageSize(): number {
        return getRelewiseUISearchOptions()?.universalSearch?.entities?.content?.pageSize ?? this.defaultPageSize;
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

    handleSearchConfigurationChanged(): void {
        if (!this.isOpen || !this.term || !this.activeTab) {
            return;
        }

        updateUrlState(this.getTakeQueryKey(this.activeTab), null);

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

        const numberOfProductsToFetch = this.getNumberOfResultsToFetch(QueryKeys.productTake);
        const numberOfProductCategoriesToFetch = this.getNumberOfResultsToFetch(QueryKeys.productCategoryTake);
        const numberOfContentToFetch = this.getNumberOfResultsToFetch(QueryKeys.contentTake);
        this.loading = true;
        this.error = null;

        if (shouldClearOldResult) {
            this.resetPages(tabs, numberOfProductsToFetch, numberOfProductCategoriesToFetch, numberOfContentToFetch);
            this.clearResults(tabs);
        }

        const relewiseUIOptions = getRelewiseUIOptions();
        const searcher = getSearcher(relewiseUIOptions);

        await new Promise(r => setTimeout(r, 0));
        const settings = await getRelewiseContextSettings(this.displayedAtLocation ?? 'Relewise Universal Search');
        this.user = settings.user;

        const requestBuilder = new SearchCollectionBuilder();

        if (tabs.includes('products')) {
            const requestResult = buildProductSearchRequest({
                term: this.term,
                settings,
                page: this.productPage,
                pageSize: this.productsPageSize,
                productsLoaded: this.products.length,
                productsToFetch: numberOfProductsToFetch,
                target: this.target,
                facetQueryKeyPrefix: QueryKeys.productFacet,
                facetUpperboundQueryKeyPrefix: QueryKeys.productFacetUpperbound,
                facetLowerboundQueryKeyPrefix: QueryKeys.productFacetLowerbound,
            });
            this.productFacetLabels = requestResult.facetLabels;
            requestBuilder.addRequest(requestResult.request);
        }

        if (tabs.includes('productCategories')) {
            requestBuilder.addRequest(createProductCategorySearchBuilder(this.term, settings)
                .pagination(p => p
                    .setPageSize(numberOfProductCategoriesToFetch && this.productCategories.length < 1 ? numberOfProductCategoriesToFetch : this.productCategoriesPageSize)
                    .setPage(numberOfProductCategoriesToFetch && this.productCategories.length < 1 ? 1 : this.productCategoryPage))
                .build());
        }

        if (tabs.includes('content')) {
            const requestResult = buildContentSearchRequest({
                term: this.term,
                settings,
                page: numberOfContentToFetch && this.content.length < 1 ? 1 : this.contentPage,
                pageSize: numberOfContentToFetch && this.content.length < 1 ? numberOfContentToFetch : this.contentPageSize,
            });
            this.contentFacetLabels = requestResult.facetLabels;
            requestBuilder.addRequest(requestResult.request);
        }

        const abortController = new AbortController();
        this.abortController = abortController;

        try {
            const response = await searcher.batch(requestBuilder.build(), { abortSignal: abortController.signal });
            if (!response) {
                return;
            }

            this.applySearchResponse(response);
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

    private applySearchResponse(response: SearchResponseCollection): void {
        const productSearchResult = findResponseOfType<ProductSearchResponse>(response.responses ?? undefined, 'ProductSearchResponse');
        if (productSearchResult) {
            this.productSearchResult = productSearchResult;
            this.products = this.products.concat(productSearchResult.results ?? []);
        }

        const productCategorySearchResult = findResponseOfType<ProductCategorySearchResponse>(response.responses ?? undefined, 'ProductCategorySearchResponse');
        if (productCategorySearchResult) {
            this.productCategorySearchResult = productCategorySearchResult;
            this.productCategories = this.productCategories.concat(productCategorySearchResult.results ?? []);
        }

        const contentSearchResult = findResponseOfType<ContentSearchResponse>(response.responses ?? undefined, 'ContentSearchResponse');
        if (contentSearchResult) {
            this.contentSearchResult = contentSearchResult;
            this.content = this.content.concat(contentSearchResult.results ?? []);
        }
    }

    private resetPages(
        tabs: UniversalSearchTab[],
        numberOfProductsToFetch: number | null,
        numberOfProductCategoriesToFetch: number | null,
        numberOfContentToFetch: number | null,
    ): void {
        if (tabs.includes('products')) {
            this.productPage = numberOfProductsToFetch ? numberOfProductsToFetch / this.productsPageSize : 1;
        }
        if (tabs.includes('productCategories')) {
            this.productCategoryPage = numberOfProductCategoriesToFetch ? numberOfProductCategoriesToFetch / this.productCategoriesPageSize : 1;
        }
        if (tabs.includes('content')) {
            this.contentPage = numberOfContentToFetch ? numberOfContentToFetch / this.contentPageSize : 1;
        }
    }

    private getTakeQueryKey(tab: UniversalSearchTab): string {
        if (tab === 'productCategories') {
            return QueryKeys.productCategoryTake;
        }
        if (tab === 'content') {
            return QueryKeys.contentTake;
        }
        return QueryKeys.productTake;
    }

    private getNumberOfResultsToFetch(queryKey: string): number | null {
        const value = readCurrentUrlState(queryKey);

        if (!value) {
            return null;
        }

        const parsedValue = parseInt(value, 10);

        if (isNaN(parsedValue)) {
            return null;
        }

        return parsedValue;
    }

    private updateUrlStateForSearchTerm(): void {
        const currentUrl = new URL(window.location.href);

        if (this.term) {
            currentUrl.searchParams.set(QueryKeys.term, this.term);
        } else {
            currentUrl.searchParams.delete(QueryKeys.term);
        }

        [
            QueryKeys.take,
            QueryKeys.productTake,
            QueryKeys.productCategoryTake,
            QueryKeys.contentTake,
        ].forEach(queryKey => currentUrl.searchParams.delete(queryKey));

        const prefixesToClear = [
            QueryKeys.facet,
            QueryKeys.facetUpperbound,
            QueryKeys.facetLowerbound,
            QueryKeys.productFacet,
            QueryKeys.productFacetUpperbound,
            QueryKeys.productFacetLowerbound,
            QueryKeys.contentFacet,
            QueryKeys.contentFacetUpperbound,
            QueryKeys.contentFacetLowerbound,
        ];

        const queryParamNames = [...new Set(Array.from(currentUrl.searchParams.keys()))];

        queryParamNames
            .filter(queryParamName => prefixesToClear.some(prefix => queryParamName.startsWith(prefix)))
            .forEach(queryParamName => currentUrl.searchParams.delete(queryParamName));

        window.history.replaceState({}, document.title, currentUrl);
    }

    private clearAllResults(): void {
        this.clearResults(['products', 'productCategories', 'content']);
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

    private get activeLocalization() {
        const universalSearchLocalization = getRelewiseUISearchOptions()?.localization?.universalSearch;
        if (this.activeTab === 'productCategories') {
            return universalSearchLocalization?.productCategories;
        }
        if (this.activeTab === 'content') {
            return universalSearchLocalization?.content;
        }
        return universalSearchLocalization?.products;
    }

    render() {
        if (!this.isOpen) {
            return nothing;
        }

        const localization = getRelewiseUISearchOptions()?.localization;
        const searchBarLocalization = localization?.searchBar;
        const universalSearchLocalization = localization?.universalSearch;

        return html`
            <div class="rw-backdrop" part="backdrop" @click=${this.closeWhenClickingOutsideDialog}>
                <section
                    class="rw-dialog"
                    part="dialog"
                    role="dialog"
                    aria-modal="true"
                    aria-label=${searchBarLocalization?.search ?? 'Search'}>
                    <header class="rw-header" part="header">
                        <relewise-search-bar
                            part="search-bar"
                            exportparts="input: search-input, icon: search-icon"
                            .term=${this.term}
                            .setSearchTerm=${(term: string) => this.setSearchTerm(term)}
                            .handleKeyEvent=${(event: KeyboardEvent) => this.handleKeyEvent(event)}
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
                        <slot>
                            ${this.renderDefaultView()}
                        </slot>
                    </div>
                </section>
            </div>
        `;
    }

    renderDefaultView() {
        const universalSearchLocalization = getRelewiseUISearchOptions()?.localization?.universalSearch;

        if (!this.term) {
            return html`<p class="rw-empty" part="empty-state">${universalSearchLocalization?.emptyState ?? 'Start typing to search.'}</p>`;
        }

        const tabs = this.enabledTabs;
        if (tabs.length === 0) {
            return html`<p class="rw-empty" part="empty-state">${universalSearchLocalization?.noEntitiesConfigured ?? 'No universal-search entities configured.'}</p>`;
        }

        return html`
            ${this.renderResultsSummary()}
            <nav class="rw-tabs" part="tabs" aria-label=${universalSearchLocalization?.tabsLabel ?? 'Search result tabs'}>
                ${tabs.map(tab => this.renderTab(tab))}
            </nav>
            ${this.renderActiveTab()}
        `;
    }

    renderTab(tab: UniversalSearchTab) {
        const localization = this.getTabLocalization(tab);
        const result = this.getTabResult(tab);

        return html`
            <button
                class="rw-tab"
                part="tab"
                type="button"
                aria-selected=${this.activeTab === tab}
                @click=${() => this.handleSelectTab(tab)}>
                ${localization.tab}
                ${result ? html`<span class="rw-tab-count" part="tab-count">${result.hits}</span>` : nothing}
            </button>
        `;
    }

    renderActiveTab() {
        if (this.activeTab === 'productCategories') {
            return this.renderProductCategoriesTab();
        }

        if (this.activeTab === 'content') {
            return this.renderContentTab();
        }

        return this.renderProductsTab();
    }

    renderProductsTab() {
        const productsLocalization = this.getTabLocalization('products');

        return html`
            <div class="rw-results-layout" part="results-layout">
                ${this.products.length > 0 && this.productSearchResult?.facets ? html`
                    <relewise-facets
                        class="rw-facets"
                        part="facets"
                        exportparts="container: facet-container, title: facet-title, input: facet-input, label: facet-label, value: facet-value, hits: facet-hits"
                        .labels=${this.productFacetLabels}
                        .facetQueryKeyPrefix=${QueryKeys.productFacet}
                        .facetUpperboundQueryKeyPrefix=${QueryKeys.productFacetUpperbound}
                        .facetLowerboundQueryKeyPrefix=${QueryKeys.productFacetLowerbound}
                        .facetResult=${this.productSearchResult.facets}>
                    </relewise-facets>
                ` : nothing}
                <section class="rw-results" part="results">
                    <header class="rw-results-header" part="results-header">
                        ${this.renderResultsHeader('products')}
                        ${this.products.length > 0 ? html`
                            <relewise-product-search-sorting
                                class="rw-sorting"
                                part="sorting"
                                .target=${this.target}
                                exportparts="select: sorting-select, label: sorting-label">
                            </relewise-product-search-sorting>
                        ` : nothing}
                    </header>
                    ${this.renderProductResults()}
                </section>
            </div>
        `;
    }

    renderProductCategoriesTab() {
        return html`
            <section class="rw-results" part="results">
                <header class="rw-results-header" part="results-header">
                    ${this.renderResultsHeader('productCategories')}
                </header>
                ${this.renderProductCategoryResults()}
            </section>
        `;
    }

    renderContentTab() {
        return html`
            <div class="rw-results-layout" part="results-layout">
                ${this.content.length > 0 && this.contentSearchResult?.facets ? html`
                    <relewise-facets
                        class="rw-facets"
                        part="facets"
                        exportparts="container: facet-container, title: facet-title, input: facet-input, label: facet-label, value: facet-value, hits: facet-hits"
                        .labels=${this.contentFacetLabels}
                        .facetQueryKeyPrefix=${QueryKeys.contentFacet}
                        .facetUpperboundQueryKeyPrefix=${QueryKeys.contentFacetUpperbound}
                        .facetLowerboundQueryKeyPrefix=${QueryKeys.contentFacetLowerbound}
                        .facetResult=${this.contentSearchResult.facets}>
                    </relewise-facets>
                ` : nothing}
                <section class="rw-results" part="results">
                    <header class="rw-results-header" part="results-header">
                        ${this.renderResultsHeader('content')}
                    </header>
                    ${this.renderContentResults()}
                </section>
            </div>
        `;
    }

    renderResultsSummary() {
        const localization = this.activeLocalization;

        return html`
            <div class="rw-results-summary" part="results-summary">
                ${localization?.resultsFor ?? 'Search results for'} <strong>${this.term}</strong>
            </div>
        `;
    }

    renderResultsHeader(tab: UniversalSearchTab) {
        const localization = this.getTabLocalization(tab);
        const result = this.getTabResult(tab);

        return html`
            <div>
                <h2 class="rw-results-title" part="results-title">${localization.resultsTitle}</h2>
                ${result ? html`
                    <span class="rw-results-count" part="results-count">${result.hits} ${result.hits === 1 ? localization.result : localization.results}</span>
                ` : nothing}
            </div>
        `;
    }

    renderProductResults() {
        const productsLocalization = this.getTabLocalization('products');

        if (this.error) {
            return html`<p class="rw-empty" part="error-state">${this.error}</p>`;
        }

        if (this.loading && this.products.length === 0) {
            return html`
                <div class="rw-loading" part="loading-state">
                    <relewise-loading-spinner></relewise-loading-spinner>
                </div>
            `;
        }

        if (!this.productSearchResult) {
            return nothing;
        }

        if (this.products.length === 0) {
            return html`<p class="rw-empty" part="zero-results">${productsLocalization.noResults}</p>`;
        }

        return html`
            <div class="rw-result-grid" part="product-grid">
                ${this.products.map(product => html`
                    <relewise-product-tile
                        class="rw-product-tile"
                        part="product-tile"
                        .product=${product}
                        .user=${this.user}>
                    </relewise-product-tile>
                `)}
            </div>
            ${this.renderLoadMore(this.products.length, this.productSearchResult?.hits ?? 0, productsLocalization.results)}
        `;
    }

    renderProductCategoryResults() {
        const productCategoriesLocalization = this.getTabLocalization('productCategories');

        if (this.error) {
            return html`<p class="rw-empty" part="error-state">${this.error}</p>`;
        }

        if (this.loading && this.productCategories.length === 0) {
            return html`
                <div class="rw-loading" part="loading-state">
                    <relewise-loading-spinner></relewise-loading-spinner>
                </div>
            `;
        }

        if (this.productCategories.length === 0) {
            return html`<p class="rw-empty" part="zero-results">${productCategoriesLocalization.noResults}</p>`;
        }

        return html`
            <div class="rw-result-grid" part="category-grid">
                ${this.productCategories.map(category => html`
                    <relewise-category-tile
                        class="rw-category-tile"
                        part="category-tile"
                        .category=${category}>
                    </relewise-category-tile>
                `)}
            </div>
            ${this.renderLoadMore(this.productCategories.length, this.productCategorySearchResult?.hits ?? 0, productCategoriesLocalization.results)}
        `;
    }

    renderContentResults() {
        const contentLocalization = this.getTabLocalization('content');

        if (this.error) {
            return html`<p class="rw-empty" part="error-state">${this.error}</p>`;
        }

        if (this.loading && this.content.length === 0) {
            return html`
                <div class="rw-loading" part="loading-state">
                    <relewise-loading-spinner></relewise-loading-spinner>
                </div>
            `;
        }

        if (this.content.length === 0) {
            return html`<p class="rw-empty" part="zero-results">${contentLocalization.noResults}</p>`;
        }

        return html`
            <div class="rw-result-grid" part="content-grid">
                ${this.content.map(content => html`
                    <relewise-content-tile
                        class="rw-content-tile"
                        part="content-tile"
                        .content=${content}
                        .user=${this.user}>
                    </relewise-content-tile>
                `)}
            </div>
            ${this.renderLoadMore(this.content.length, this.contentSearchResult?.hits ?? 0, contentLocalization.results)}
        `;
    }

    renderLoadMore(loaded: number, total: number, resultLabel: string) {
        const localization = getRelewiseUISearchOptions()?.localization?.loadMoreButton;

        return html`
            ${this.loading ? html`
                <div class="rw-loading" part="loading-state">
                    <relewise-loading-spinner></relewise-loading-spinner>
                </div>
            ` : nothing}
            ${loaded < total ? html`
                <div class="rw-load-more" part="load-more">
                    <span class="rw-results-shown">
                        ${localization?.showing ?? 'Showing'} ${loaded} ${localization?.outOf ?? 'out of'} ${total} ${resultLabel}
                    </span>
                    <relewise-button @click=${this.handleLoadMoreActiveTab}>
                        <span>${localization?.loadMore ?? 'Load More'}</span>
                    </relewise-button>
                </div>
            ` : nothing}
        `;
    }

    private getTabResult(tab: UniversalSearchTab): ProductSearchResponse | ProductCategorySearchResponse | ContentSearchResponse | null {
        if (tab === 'productCategories') {
            return this.productCategorySearchResult;
        }
        if (tab === 'content') {
            return this.contentSearchResult;
        }
        return this.productSearchResult;
    }

    private getTabLocalization(tab: UniversalSearchTab) {
        const universalSearchLocalization = getRelewiseUISearchOptions()?.localization?.universalSearch;
        const defaults = {
            products: {
                tab: 'Products',
                resultsFor: 'Search results for',
                resultsTitle: 'Products',
                result: 'product',
                results: 'products',
                noResults: 'No products found.',
                error: 'Could not load products.',
            },
            productCategories: {
                tab: 'Categories',
                resultsFor: 'Search results for',
                resultsTitle: 'Category Results',
                result: 'category',
                results: 'categories',
                noResults: 'No categories found.',
                error: 'Could not load categories.',
            },
            content: {
                tab: 'Content',
                resultsFor: 'Search results for',
                resultsTitle: 'Content Results',
                result: 'content result',
                results: 'content results',
                noResults: 'No content found.',
                error: 'Could not load content.',
            },
        };

        return {
            ...defaults[tab],
            ...universalSearchLocalization?.[tab],
        };
    }

    static styles = universalSearchStyles;
}

function isResponseWithType(response: any, typeName: string): boolean {
    if (!response || typeof response !== 'object') return false;
    const maybeType = response.$type ?? response['@type'] ?? response.type;
    return typeof maybeType === 'string' && maybeType.includes(typeName);
}

function findResponseOfType<T>(responses: any[] | undefined, typeName: string): T | undefined {
    if (!responses) return undefined;
    return responses.find(r => isResponseWithType(r, typeName)) as T | undefined;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-universal-search': UniversalSearch;
    }
}
