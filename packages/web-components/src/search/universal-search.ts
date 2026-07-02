import { ProductResult, ProductSearchResponse, User } from '@relewise/client';
import { css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events, QueryKeys, getNumberOfProductsToFetch, getRelewiseUISearchOptions, readCurrentUrlState, updateUrlState } from '../helpers';
import { getRelewiseContextSettings, getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { RelewiseLitElement } from '../relewise-lit-element';
import { theme } from '../theme';
import { buildProductSearchRequest } from './productSearchRequestBuilder';
import { getSearcher } from './searcher';

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
    activeTab: 'products' | null = null;

    @state()
    searchResult: ProductSearchResponse | null = null;

    @state()
    products: ProductResult[] = [];

    @state()
    page: number = 1;

    @state()
    loading: boolean = false;

    @state()
    error: string | null = null;

    @state()
    facetLabels: string[] = [];

    @state()
    private user: User | null = null;

    @state()
    abortController: AbortController = new AbortController();

    private debounceTimeoutHandlerId: ReturnType<typeof setTimeout> | null = null;
    private handleWindowKeyDownBound = this.handleWindowKeyDown.bind(this);
    private handleSearchConfigurationChangedBound = this.handleSearchConfigurationChanged.bind(this);
    private defaultProductsPageSize = 16;

    connectedCallback(): void {
        super.connectedCallback();
        this.term = readCurrentUrlState(QueryKeys.term) ?? '';
        this.activeTab = this.productsTabEnabled && this.term ? 'products' : null;
        window.addEventListener('keydown', this.handleWindowKeyDownBound);
        window.addEventListener(Events.applyFacet, this.handleSearchConfigurationChangedBound);
        window.addEventListener(Events.applySorting, this.handleSearchConfigurationChangedBound);

        if (this.isOpen) {
            this.searchProducts(true);
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
        this.searchProducts(true);
    }

    close(): void {
        this.isOpen = false;
    }

    setSearchTerm(term: string): void {
        this.term = term;

        if (this.debounceTimeoutHandlerId) {
            clearTimeout(this.debounceTimeoutHandlerId);
        }

        this.debounceTimeoutHandlerId = setTimeout(() => {
            updateUrlState(QueryKeys.term, this.term || null);
            updateUrlState(QueryKeys.take, null);
            if (this.isOpen) {
                this.searchProducts(true);
            }
        }, getRelewiseUISearchOptions()?.debounceTimeInMs);
    }

    private get productsTabEnabled(): boolean {
        return Boolean(getRelewiseUISearchOptions()?.universalSearch?.tabs?.products);
    }

    private get productsPageSize(): number {
        return getRelewiseUISearchOptions()?.universalSearch?.tabs?.products?.pageSize ?? this.defaultProductsPageSize;
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
        if (!this.isOpen || this.activeTab !== 'products') {
            return;
        }

        updateUrlState(QueryKeys.take, null);
        this.searchProducts(true);
    }

    handleLoadMoreProducts(): void {
        this.page = this.page + 1;
        updateUrlState(QueryKeys.take, (this.productsPageSize * this.page).toString());
        this.searchProducts(false);
    }

    async searchProducts(shouldClearOldResult: boolean): Promise<void> {
        this.abortController.abort();

        if (!this.productsTabEnabled || !this.term) {
            this.activeTab = null;
            this.products = [];
            this.searchResult = null;
            this.error = null;
            this.loading = false;
            return;
        }

        const numberOfProductsToFetch = getNumberOfProductsToFetch();
        this.activeTab = 'products';
        this.loading = true;
        this.error = null;

        if (shouldClearOldResult) {
            this.page = numberOfProductsToFetch ? numberOfProductsToFetch / this.productsPageSize : 1;
            this.products = [];
            this.searchResult = null;
        }

        const relewiseUIOptions = getRelewiseUIOptions();
        const searcher = getSearcher(relewiseUIOptions);

        await new Promise(r => setTimeout(r, 0));
        const settings = await getRelewiseContextSettings(this.displayedAtLocation ?? 'Relewise Universal Search');
        this.user = settings.user;

        const requestResult = buildProductSearchRequest({
            term: this.term,
            settings,
            page: this.page,
            pageSize: this.productsPageSize,
            productsLoaded: this.products.length,
            productsToFetch: numberOfProductsToFetch,
            target: this.target,
        });
        this.facetLabels = requestResult.facetLabels;

        const abortController = new AbortController();
        this.abortController = abortController;

        try {
            const response = await searcher.searchProducts(requestResult.request, { abortSignal: abortController.signal });
            if (!response) {
                return;
            }

            this.searchResult = response;
            this.products = this.products.concat(response.results ?? []);
        } catch (error) {
            if (!abortController.signal.aborted) {
                const productsLocalization = getRelewiseUISearchOptions()?.localization?.universalSearch?.products;
                this.error = error instanceof Error ? error.message : productsLocalization?.error ?? 'Could not load products.';
            }
        } finally {
            if (!abortController.signal.aborted) {
                this.loading = false;
            }
        }
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
        const productsLocalization = universalSearchLocalization?.products;

        if (!this.term) {
            return html`<p class="rw-empty" part="empty-state">${universalSearchLocalization?.emptyState ?? 'Start typing to search.'}</p>`;
        }

        if (this.productsTabEnabled) {
            return html`
                <nav class="rw-tabs" part="tabs" aria-label=${universalSearchLocalization?.tabsLabel ?? 'Search result tabs'}>
                    <button
                        class="rw-tab"
                        part="tab"
                        type="button"
                        aria-selected=${this.activeTab === 'products'}>
                        ${productsLocalization?.tab ?? 'Products'}
                        ${this.searchResult ? html`<span class="rw-tab-count" part="tab-count">${this.searchResult.hits}</span>` : nothing}
                    </button>
                </nav>
                ${this.renderProductsTab()}
            `;
        }

        return html`<p class="rw-empty" part="empty-state">${universalSearchLocalization?.noTabsConfigured ?? 'No universal-search tabs configured.'}</p>`;
    }

    renderProductsTab() {
        const productsLocalization = getRelewiseUISearchOptions()?.localization?.universalSearch?.products;

        return html`
            <div class="rw-results-summary" part="results-summary">
                ${productsLocalization?.resultsFor ?? 'Search results for'} <strong>${this.term}</strong>
            </div>
            <div class="rw-results-layout" part="results-layout">
                ${this.products.length > 0 && this.searchResult?.facets ? html`
                    <relewise-facets
                        class="rw-facets"
                        part="facets"
                        exportparts="container: facet-container, title: facet-title, input: facet-input, label: facet-label, value: facet-value, hits: facet-hits"
                        .labels=${this.facetLabels}
                        .facetResult=${this.searchResult.facets}>
                    </relewise-facets>
                ` : nothing}
                <section class="rw-results" part="results">
                    <header class="rw-results-header" part="results-header">
                        <div>
                            <h2 class="rw-results-title" part="results-title">${productsLocalization?.resultsTitle ?? 'Product Results'}</h2>
                            ${this.searchResult ? html`
                                <span class="rw-results-count" part="results-count">${this.searchResult.hits} ${this.searchResult.hits === 1 ? (productsLocalization?.result ?? 'product') : (productsLocalization?.results ?? 'products')}</span>
                            ` : nothing}
                        </div>
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

    renderProductResults() {
        const localization = getRelewiseUISearchOptions()?.localization?.loadMoreButton;
        const productsLocalization = getRelewiseUISearchOptions()?.localization?.universalSearch?.products;

        if (this.error) {
            return html`<p class="rw-empty" part="error-state">${this.error}</p>`;
        }

        if (this.loading && this.products.length === 0) {
            return html`<relewise-loading-spinner></relewise-loading-spinner>`;
        }

        if (this.products.length === 0) {
            return html`<p class="rw-empty" part="zero-results">${productsLocalization?.noResults ?? 'No products found.'}</p>`;
        }

        return html`
            <div class="rw-product-grid" part="product-grid">
                ${this.products.map(product => html`
                    <relewise-product-tile
                        class="rw-product-tile"
                        part="product-tile"
                        .product=${product}
                        .user=${this.user}>
                    </relewise-product-tile>
                `)}
            </div>
            ${this.loading ? html`<relewise-loading-spinner></relewise-loading-spinner>` : nothing}
            ${this.searchResult && this.products.length < this.searchResult.hits ? html`
                <div class="rw-load-more" part="load-more">
                    <span class="rw-products-shown">
                        ${localization?.showing ?? 'Showing'} ${this.products.length} ${localization?.outOf ?? 'out of'} ${this.searchResult.hits} ${localization?.products ?? 'products'}
                    </span>
                    <relewise-button @click=${this.handleLoadMoreProducts}>
                        <span>${localization?.loadMore ?? 'Load More'}</span>
                    </relewise-button>
                </div>
            ` : nothing}
        `;
    }

    static styles = [theme, css`
        :host {
            font-family: var(--font);
            --relewise-universal-search-color: var(--relewise-color, #212427);
        }

        .rw-backdrop {
            position: fixed;
            inset: 0;
            z-index: var(--relewise-universal-search-z-index, 1000);
            background: var(--relewise-universal-search-backdrop-background, rgb(0 0 0 / 0.35));
            display: flex;
            justify-content: center;
            align-items: stretch;
        }

        .rw-dialog {
            background: var(--relewise-universal-search-background, white);
            color: var(--relewise-universal-search-color);
            --color: var(--relewise-universal-search-color);
            width: var(--relewise-universal-search-width, 100%);
            height: var(--relewise-universal-search-height, 100%);
            display: flex;
            flex-direction: column;
        }

        .rw-header {
            display: flex;
            gap: var(--relewise-universal-search-header-gap, 1em);
            align-items: center;
            padding: var(--relewise-universal-search-header-padding, 1em);
            border-bottom: 1px solid var(--relewise-universal-search-border-color, #ddd);
        }

        relewise-search-bar {
            flex: 1;
        }

        .rw-close {
            flex: 0 0 auto;
            height: var(--relewise-product-search-bar-height, 3em);
            margin: 0;
            padding: var(--relewise-universal-search-close-button-padding, 0 0.75em);
            --relewise-button-icon-padding: 0;
            --relewise-button-text-color: var(--relewise-universal-search-color);
        }

        .rw-body {
            flex: 1;
            overflow: auto;
            padding: var(--relewise-universal-search-body-padding, 1em);
        }

        .rw-empty {
            margin: 0;
        }

        .rw-tabs {
            display: flex;
            gap: var(--relewise-universal-search-tabs-gap, 0.5em);
            border-bottom: 1px solid var(--relewise-universal-search-border-color, #ddd);
            margin-bottom: var(--relewise-universal-search-tabs-margin-bottom, 1em);
        }

        .rw-tab {
            appearance: none;
            background: transparent;
            border: 0;
            border-bottom: 2px solid transparent;
            cursor: pointer;
            font: inherit;
            padding: var(--relewise-universal-search-tab-padding, 0.5em 0);
        }

        .rw-tab[aria-selected="true"] {
            border-bottom-color: var(--relewise-universal-search-tab-active-border-color, currentColor);
            font-weight: 600;
        }

        .rw-tab-count {
            margin-left: 0.25em;
            font-size: 0.8em;
        }

        .rw-results-summary {
            margin-bottom: var(--relewise-universal-search-results-summary-margin-bottom, 1em);
        }

        .rw-results-layout {
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            gap: var(--relewise-universal-search-layout-gap, 1em);
        }

        .rw-results-layout:has(.rw-facets) {
            grid-template-columns: minmax(12em, 1fr) minmax(0, 3fr);
        }

        .rw-results-header {
            display: flex;
            justify-content: space-between;
            gap: 1em;
            align-items: center;
            margin-bottom: var(--relewise-universal-search-results-header-margin-bottom, 1em);
        }

        .rw-results-title {
            font-size: var(--relewise-universal-search-results-title-font-size, 1.1em);
            margin: 0;
        }

        .rw-results-count {
            font-size: 0.9em;
        }

        .rw-product-grid {
            display: grid;
            grid-template-columns: repeat(var(--relewise-universal-search-product-columns, 4), minmax(0, 1fr));
            gap: var(--relewise-universal-search-product-grid-gap, 1em);
        }

        .rw-load-more {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5em;
            margin-top: var(--relewise-universal-search-load-more-margin-top, 1em);
        }

        @media (max-width: 768px) {
            .rw-header,
            .rw-results-header {
                align-items: stretch;
                flex-direction: column;
            }

            .rw-results-layout:has(.rw-facets) {
                grid-template-columns: minmax(0, 1fr);
            }

            .rw-product-grid {
                grid-template-columns: repeat(var(--relewise-universal-search-mobile-product-columns, 2), minmax(0, 1fr));
            }
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-universal-search': UniversalSearch;
    }
}
