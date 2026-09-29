import { RelewiseLitElement } from '../relewise-lit-element';
import { ProductResult, ProductSearchResponse, User } from '@relewise/client';
import { css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events, QueryKeys, SessionVariables, getNumberOfProductsToFetch, readCurrentUrlState, updateUrlState } from '../helpers';
import { getRelewiseContextSettings, getRelewiseUIOptions, getRelewiseUISearchOptions } from '../helpers/relewiseUIOptions';
import { theme } from '../theme';
import { getSearcher } from './searcher';
import { buildProductSearchRequest } from '../builders/productSearchRequestBuilder';
import { hasRenderableFacets } from './components/facets/facet-result-visibility';
import type { ProductSearchRenderPage } from './retailMediaRendering';

export class ProductSearch extends RelewiseLitElement {

    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string = undefined;

    @property({ type: Number, attribute: 'number-of-products' })
    numberOfProducts: number = 16;

    @property({ type: String, attribute: 'target' })
    target: string | null = null;

    @state()
    searchResult: ProductSearchResponse | null = null;

    @state()
    products: ProductResult[] = [];

    @state()
    page: number = 1;

    @state()
    resultOffset: number = 0;

    @state()
    rememberScrollPosition: boolean | undefined = undefined;

    @state()
    abortController: AbortController = new AbortController();

    @state()
    facetLabels: string[] = [];

    @state()
    private retailMediaPages: ProductSearchRenderPage[] = [];

    @state()
    private user: User | null = null;

    handleSearchEventBound = this.handleSearchEvent.bind(this);
    handleLoadMoreEventBound = this.handleLoadMoreEvent.bind(this);
    handleLoadPreviousEventBound = this.handleLoadPreviousEvent.bind(this);
    handleScrollEventBound = this.handleScrollEvent.bind(this);

    async connectedCallback() {
        if (!this.displayedAtLocation) {
            console.error('No displayedAtLocation defined!');
        }

        this.rememberScrollPosition = getRelewiseUISearchOptions()?.rememberScrollPosition;

        const productsToFetch = getNumberOfProductsToFetch();
        if (productsToFetch) {
            this.page = Math.ceil(productsToFetch / this.numberOfProducts);
        }

        this.search(false);

        window.addEventListener(Events.search, this.handleSearchEventBound);
        window.addEventListener(Events.applyFacet, this.handleSearchEventBound);
        window.addEventListener(Events.applySorting, this.handleSearchEventBound);
        window.addEventListener(Events.loadMoreProducts, this.handleLoadMoreEventBound);
        window.addEventListener(Events.loadPreviousProducts, this.handleLoadPreviousEventBound);

        if (this.rememberScrollPosition) {
            window.addEventListener('scroll', this.handleScrollEventBound);
        }

        super.connectedCallback();
    }

    disconnectedCallback() {
        window.removeEventListener(Events.search, this.handleSearchEventBound);
        window.removeEventListener(Events.applyFacet, this.handleSearchEventBound);
        window.removeEventListener(Events.applySorting, this.handleSearchEventBound);
        window.removeEventListener(Events.loadMoreProducts, this.handleLoadMoreEventBound);
        window.removeEventListener(Events.loadPreviousProducts, this.handleLoadPreviousEventBound);

        if (this.rememberScrollPosition) {
            window.removeEventListener('scroll', this.handleScrollEventBound);
        }

        this.abortController.abort();
        super.disconnectedCallback();
    }

    handleSearchEvent() {
        this.search(true);
    }

    handleLoadMoreEvent(): void {
        void this.loadMore();
    }

    handleLoadPreviousEvent(): void {
        void this.loadPrevious();
    }

    private async loadMore(): Promise<void> {
        const previousPage = this.page;
        const requestedPage = previousPage + 1;
        this.page = requestedPage;
        const succeeded = await this.performSearch(false);

        if (!succeeded) {
            if (this.page === requestedPage) {
                this.page = previousPage;
            }
            return;
        }

        updateUrlState(QueryKeys.take, (this.resultOffset + this.products.length).toString());
    }

    private async loadPrevious(): Promise<void> {
        if (this.resultOffset === 0) {
            return;
        }

        await this.performSearch(false, true);
    }

    handleScrollEvent() {
        sessionStorage.setItem(SessionVariables.scrollPosition, window.scrollY.toString());
    }

    async search(shouldClearOldResult: boolean): Promise<void> {
        await this.performSearch(shouldClearOldResult);
    }

    private async performSearch(shouldClearOldResult: boolean, prepend = false): Promise<boolean> {
        this.abortController.abort();

        if (shouldClearOldResult) {
            window.dispatchEvent(new CustomEvent(Events.dimPreviousResult));
            this.page = 1;
            updateUrlState(QueryKeys.take, null);
        } else {
            window.dispatchEvent(new CustomEvent(Events.showLoadingSpinner));
        }

        const term = readCurrentUrlState(QueryKeys.term) ?? null;

        const minimumQueryLength = getRelewiseUISearchOptions()?.minimumQueryLength ?? 1;
        if (term && term.length < minimumQueryLength) {
            this.products = [];
            this.searchResult = null;
            this.facetLabels = [];
            this.retailMediaPages = [];
            this.resultOffset = 0;
            if (this.renderRoot) {
                this.setSearchResultOnSlotChilderen();
            }
            window.dispatchEvent(new CustomEvent(Events.searchingForProductsCompleted));
            return false;
        }

        const abortController = new AbortController();
        this.abortController = abortController;
        try {
            const relewiseUIOptions = getRelewiseUIOptions();
            const searcher = getSearcher(relewiseUIOptions);

            // Wait a tick so runtime filter extensions can run before the first automatic search executes.
            await new Promise(r => setTimeout(r, 0));
            if (abortController.signal.aborted || abortController !== this.abortController) {
                return false;
            }

            const settings = await getRelewiseContextSettings(this.displayedAtLocation ? this.displayedAtLocation : 'Relewise Product Search');
            if (abortController.signal.aborted || abortController !== this.abortController) {
                return false;
            }

            const pagination = this.getPagination(shouldClearOldResult, prepend);
            const requestResult = buildProductSearchRequest({
                term,
                settings,
                page: this.page,
                pageSize: pagination.take,
                productsLoaded: this.products.length,
                productsToFetch: null,
                target: this.target,
            });
            requestResult.request.take = pagination.take;
            requestResult.request.skip = pagination.skip;
            const response = await searcher.searchProducts(requestResult.request, { abortSignal: abortController.signal });
            if (abortController.signal.aborted || abortController !== this.abortController) {
                return false;
            }

            if (!response) {
                return false;
            }

            if (response.hits
                && !response.results?.length
                && this.products.length === 0
                && pagination.skip >= response.hits) {
                updateUrlState(QueryKeys.take, response.hits.toString());
                this.page = Math.max(1, Math.ceil(response.hits / this.numberOfProducts));
                return this.performSearch(false);
            }

            if (shouldClearOldResult) {
                this.products = [];
                this.searchResult = null;
                this.retailMediaPages = [];
            }

            const products = response.results ?? [];
            const retailMediaPage: ProductSearchRenderPage = {
                products,
                retailMedia: response.retailMedia,
                retailMediaTargetConfiguration: requestResult.retailMediaTargetConfiguration,
            };
            this.user = settings.user;
            this.facetLabels = requestResult.facetLabels;
            this.searchResult = response;
            this.products = prepend ? products.concat(this.products) : this.products.concat(products);
            this.retailMediaPages = prepend
                ? [retailMediaPage, ...this.retailMediaPages]
                : [...this.retailMediaPages, retailMediaPage];
            if (shouldClearOldResult || prepend || this.products.length === products.length) {
                this.resultOffset = pagination.skip;
            }

            this.setSearchResultOnSlotChilderen();
            return true;
        } catch (error) {
            if (!abortController.signal.aborted && abortController === this.abortController) {
                console.error('Relewise Web Components: Product search failed.', error);
            }
            return false;
        } finally {
            if (!abortController.signal.aborted && abortController === this.abortController) {
                window.dispatchEvent(new CustomEvent(Events.searchingForProductsCompleted));
            }
        }
    }

    private getPagination(reset: boolean, prepend: boolean): { take: number; skip: number } {
        if (reset) {
            return { take: this.numberOfProducts, skip: 0 };
        }

        if (prepend) {
            const take = Math.min(this.resultOffset, this.numberOfProducts);
            return { take, skip: this.resultOffset - take };
        }

        const productsToFetch = this.products.length === 0 ? getNumberOfProductsToFetch() : null;
        if (productsToFetch) {
            const take = Math.min(productsToFetch, this.numberOfProducts);
            return { take, skip: productsToFetch - take };
        }

        return {
            take: this.numberOfProducts,
            skip: this.resultOffset + this.products.length,
        };
    }

    setSearchResultOnSlotChilderen() {
        const slot = this.renderRoot.querySelector('slot');
        if (slot) {
            const assignedNodes = slot.assignedNodes();
            this.setDataOnNodes(assignedNodes);
        }
    }

    setDataOnNodes(nodes: Node[]) {
        nodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE && node instanceof HTMLElement) {

                if (node.tagName.toLowerCase() === 'relewise-product-search-results') {
                    const results = node as HTMLElement & {
                        products: ProductResult[];
                        retailMediaPages: ProductSearchRenderPage[];
                        user: User | null;
                    };
                    results.products = this.products;
                    results.retailMediaPages = this.retailMediaPages;
                    results.user = this.user;
                }

                if (node.tagName.toLowerCase() === 'relewise-product-search-load-more-button') {
                    node.setAttribute('products-loaded', this.products.length.toString());
                    node.setAttribute('hits', this.searchResult?.hits.toString() ?? '');
                    node.setAttribute('offset', this.resultOffset.toString());
                }

                if (node.tagName.toLowerCase() === 'relewise-facets') {
                    node.setAttribute('facets-result', JSON.stringify(this.searchResult?.facets));
                    node.setAttribute('labels', JSON.stringify(this.facetLabels));
                    node.setAttribute('total-hits', this.searchResult?.hits.toString() ?? '');
                }

                if (node.tagName.toLowerCase() === 'relewise-product-search-sorting') {
                    if (this.target) {
                        node.setAttribute('target', this.target);
                    } else {
                        node.removeAttribute('target');
                    }
                }

                if (node.children.length > 0) {
                    this.setDataOnNodes(Array.from(node.childNodes));
                }
            }
        });
    }

    async updated() {
        if (!this.rememberScrollPosition) {
            return;
        }

        const valueFromStorage = sessionStorage.getItem(SessionVariables.scrollPosition);
        if (!valueFromStorage || +valueFromStorage === window.scrollY) {
            return;
        }

        // Ensure render completed before scrolling
        setTimeout(() => window.scrollTo(0, +valueFromStorage), 0);
    }

    render() {
        const localization = getRelewiseUISearchOptions()?.localization?.searchResults;
        return html`
        <slot>
            <relewise-product-search-bar
                class="rw-product-search-bar">
            </relewise-product-search-bar>
          
            <div class="result-container">
                ${this.products.length > 0 && hasRenderableFacets(this.searchResult?.facets, this.searchResult?.hits) ? html`
                    <relewise-facets
                        exportparts="container: facet-container, title: facet-title, selected-count: facet-selected-count, input: facet-input, label: facet-label, value: facet-value, hits: facet-hits"
                        .labels=${this.facetLabels}
                        .facetResult=${this.searchResult?.facets}
                        .totalHits=${this.searchResult?.hits}
                        class="rw-facets">
                    </relewise-facets>
                `: nothing}
                <div class="rw-full-width">
                ${this.products.length > 0 ? html`
                    <div class="rw-sorting-container">
                     <span class="rw-results-text">${this.searchResult?.hits ?? 0} ${this.searchResult?.hits === 1 ? localization?.result ?? 'Result' : localization?.results ?? 'Results'}</span>
                     <div class="rw-sorting-button-container">
                        <relewise-product-search-sorting .target=${this.target} class="rw-sorting-button" exportparts="select: sorting-select, label: sorting-label"></relewise-product-search-sorting>
                        </div>
                    </div>` : nothing}
                 
                    <relewise-product-search-load-more-button
                        class="rw-load-more"
                        direction="previous"
                        .offset=${this.resultOffset}
                        .productsLoaded=${this.products.length}
                        .hits=${this.searchResult?.hits ?? null}>
                    </relewise-product-search-load-more-button>
                    <relewise-product-search-results
                        exportparts="retail-media-product, retail-media-display-ad, retail-media-product-tile, sponsored-label, display-ad"
                        .products=${this.products}
                        .retailMediaPages=${this.retailMediaPages}
                        .user=${this.user}>
                    </relewise-product-search-results>
                    <relewise-product-search-load-more-button
                        class="rw-load-more"
                        .offset=${this.resultOffset}
                        .productsLoaded=${this.products.length}
                        .hits=${this.searchResult?.hits ?? null}>
                    </relewise-product-search-load-more-button>
                </div>
            </div>
        </slot>
        `;
    }

    static styles = [theme, css`
        :host {
            font-family: var(--font);
        }

        .rw-product-search-bar {
            margin-top: var(--relewise-product-search-bar-margin-top, .5em);
            margin-bottom: var(--relewise-product-search-bar-margin-bottom, .5em);
        }

        .rw-sorting-button-container {
            display: var(--relewise-sorting-button-container-display, flex);
        }

        .rw-full-width {
            display: flex;
            flex-direction: column;
            width: 100%;
        }
        .rw-sorting-container {
            display: flex; 
            justify-content: space-between; 
            align-items: center;
        }
        .rw-results-text {
            font-weight: 500; 
            color: #333;
        }

        .rw-sorting-button {
            margin-bottom: .5em;
        }

        .rw-load-more {
            margin: .5em;
        }

        .rw-facets {
            display: flex;
            flex-direction: column;
            margin-bottom: .5em;
        }

        @media (min-width: 1024px) {
            .result-container {
                display: grid;
                grid-template-columns: minmax(0, 1fr);
                gap: 1em;
                width: 100%;
            }

            /* Only create two columns when facets exist */
            .result-container:has(.rw-facets) {
                grid-template-columns: 1fr 3fr;
            }

            .rw-sorting-button {
                margin-left: var(--relewise-sorting-button-margin-left, auto);
            }
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-search': ProductSearch;
    }
}
