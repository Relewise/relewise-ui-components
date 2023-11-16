import { DoubleNullableRange, ProductResult, ProductSearchBuilder, ProductSearchResponse } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { RelewiseFacetBuilder } from '../app';
import { defaultProductProperties } from '../defaultProductProperties';
import { Events, QueryKeys, SessionVariables, getNumberOfProductsToFetch, readCurrentUrlState, readCurrentUrlStateValues, updateUrlState } from '../helpers';
import { getRelewiseContextSettings, getRelewiseUIOptions, getRelewiseUISearchOptions } from '../helpers/relewiseUIOptions';
import { theme } from '../theme';
import { SortingEnum } from './enums';
import { getSearcher } from './searcher';
import { Facet } from './types';

export class ProductSearch extends LitElement {

    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string = undefined;

    @property({ type: Number, attribute: 'number-of-products' })
    numberOfProducts: number = 16;

    @state()
    searchResult: ProductSearchResponse | null = null;

    @state()
    products: ProductResult[] = [];

    @state()
    page: number = 1;

    @state()
    rememberScrollPosition: boolean | undefined = undefined;

    @state()
    abortController: AbortController = new AbortController();

    @state()
    facetLabels: string[] = [];

    handleSearchEventBound = this.handleSearchEvent.bind(this);
    handleLoadMoreEventBound = this.handleLoadMoreEvent.bind(this);
    handleScrollEventBound = this.handleScrollEvent.bind(this);

    async connectedCallback() {
        if (!this.displayedAtLocation) {
            console.error('No displayedAtLocation defined!');
        }

        this.rememberScrollPosition = getRelewiseUISearchOptions()?.rememberScrollPosition;

        const productsToFetch = getNumberOfProductsToFetch();
        if (productsToFetch) {
            this.page = productsToFetch / this.numberOfProducts;
        }

        this.search(false);

        window.addEventListener(Events.search, this.handleSearchEventBound);
        window.addEventListener(Events.applyFacet, this.handleSearchEventBound);
        window.addEventListener(Events.applySorting, this.handleSearchEventBound);
        window.addEventListener(Events.loadMoreProducts, this.handleLoadMoreEventBound);

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

        if (this.rememberScrollPosition) {
            window.removeEventListener('scroll', this.handleScrollEventBound);
        }

        super.disconnectedCallback();
    }

    handleSearchEvent() {
        this.search(true);
    }

    handleLoadMoreEvent() {
        this.page = this.page + 1;
        updateUrlState(QueryKeys.take, (this.numberOfProducts * this.page).toString());
        this.search(false);
    }

    handleScrollEvent() {
        sessionStorage.setItem(SessionVariables.scrollPosition, window.scrollY.toString());
    }

    async search(shouldClearOldResult: boolean) {
        this.abortController.abort();

        if (shouldClearOldResult) {
            window.dispatchEvent(new CustomEvent(Events.dimPreviousResult));
            this.page = 1;
            updateUrlState(QueryKeys.take, null);
        } else {
            window.dispatchEvent(new CustomEvent(Events.showLoadingSpinner));
        }

        const term = readCurrentUrlState(QueryKeys.term) ?? null;

        const numberOfProductsToFetch = getNumberOfProductsToFetch();

        const relewiseUIOptions = getRelewiseUIOptions();
        const settings = getRelewiseContextSettings(this.displayedAtLocation ? this.displayedAtLocation : 'Relewise Product Search');
        const searchOptions = getRelewiseUISearchOptions();
        const searcher = getSearcher(relewiseUIOptions);

        const requestBuilder = new ProductSearchBuilder(settings)
            .setSelectedProductProperties(relewiseUIOptions.selectedPropertiesSettings?.product ?? defaultProductProperties)
            .setTerm(term ? term : null)
            .pagination(p => p
                .setPageSize(numberOfProductsToFetch && this.products.length < 1 ? numberOfProductsToFetch : this.numberOfProducts)
                .setPage(numberOfProductsToFetch && this.products.length < 1 ? 1 : this.page))
            .filters(builder => {
                if (relewiseUIOptions.filters?.product) {
                    relewiseUIOptions.filters.product(builder);
                }
                if (searchOptions && searchOptions.filters?.product) {
                    searchOptions.filters.product(builder);
                }
            })
            .facets(builder => {
                if (searchOptions && searchOptions.facets?.product) {
                    const facetBuilder = new RelewiseFacetBuilder(builder);
                    searchOptions.facets.product(facetBuilder);
                    this.facetLabels = facetBuilder.getLabels();
                }
            })
            .sorting(builder => {
                const sorting = readCurrentUrlState(QueryKeys.sortBy);
                const sortingEnum = SortingEnum[sorting as keyof typeof SortingEnum];

                switch (sortingEnum) {
                case SortingEnum.SalesPriceAsc:
                    builder.sortByProductAttribute('SalesPrice', 'Ascending', (n) => n.sortByProductRelevance());
                    break;
                case SortingEnum.SalesPriceDesc:
                    builder.sortByProductAttribute('SalesPrice', 'Descending', (n) => n.sortByProductRelevance());
                    break;
                case SortingEnum.AlphabeticallyAsc:
                    builder.sortByProductAttribute('DisplayName', 'Ascending', (n) => n.sortByProductRelevance());
                    break;
                case SortingEnum.AlphabeticallyDesc:
                    builder.sortByProductAttribute('DisplayName', 'Descending', (n) => n.sortByProductRelevance());
                    break;
                default:
                    builder.sortByProductRelevance('Descending', (n) => n.sortByProductRelevance());
                    break;
                }
            });

        const request = requestBuilder.build();

        if (request.facets) {
            request.facets.items.forEach(facet => {
                this.getSelectedValuesForFacet(facet);
            });
        }

        this.abortController = new AbortController();
        const response = await searcher.searchProducts(request, { abortSignal: this.abortController.signal });
        if (!response) {
            return;
        }

        if (shouldClearOldResult) {
            this.products = [];
            this.searchResult = null;
        }

        this.searchResult = response;
        this.products = this.products.concat(response.results ?? []);

        this.setSearchResultOnSlotChilderen();
        window.dispatchEvent(new CustomEvent(Events.searchingForProductsCompleted));
    }

    getSelectedValuesForFacet(facet: Facet) {
        if (facet.$type.includes('ProductDataDoubleRangeFacet') ||
            facet.$type.includes('PriceRangeFacet')) {
            this.getSelectedRange(facet);
            return;
        }

        if (facet.$type.includes('PriceRangesFacet') ||
            facet.$type.includes('ProductDataDoubleRangesFacet')) {
            this.getSelectedRanges(facet);
            return;
        }

        this.getSelectedStrings(facet);

        if (!facet.settings) {
            facet.settings = { alwaysIncludeSelectedInAvailable: true, includeZeroHitsInAvailable: false };
        }
    }

    getSelectedRange(facet: Facet) {
        if ('selected' in facet) {
            let upperBound = null;
            let lowerBound = null;

            if ('key' in facet) {
                upperBound = readCurrentUrlState(QueryKeys.facetUpperbound + facet.field + facet.key);
                lowerBound = readCurrentUrlState(QueryKeys.facetLowerbound + facet.field + facet.key);
            } else {
                upperBound = readCurrentUrlState(QueryKeys.facetUpperbound + facet.field);
                lowerBound = readCurrentUrlState(QueryKeys.facetLowerbound + facet.field);
            }

            facet.selected = {
                lowerBoundInclusive: lowerBound ? +lowerBound : null,
                upperBoundInclusive: upperBound ? +upperBound : null,
            };
        }
    }

    getSelectedRanges(facet: Facet) {
        if ('selected' in facet) {
            let queryValues = null;
            if ('key' in facet) {
                queryValues = readCurrentUrlStateValues(QueryKeys.facet + facet.field + facet.key);
            } else {
                queryValues = readCurrentUrlStateValues(QueryKeys.facet + facet.field);
            }
            facet.selected = queryValues.map(x => {
                const split = x.split('-');
                return {
                    lowerBoundInclusive: +split[0],
                    upperBoundExclusive: +split[1],
                } as DoubleNullableRange;
            });
        }
    }

    getSelectedStrings(facet: Facet) {
        if ('selected' in facet) {
            let queryValues = null;
            if ('key' in facet) {
                queryValues = readCurrentUrlStateValues(QueryKeys.facet + facet.field + facet.key);
            } else {
                queryValues = readCurrentUrlStateValues(QueryKeys.facet + facet.field);
            }
            facet.selected = queryValues;
        }
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
                    node.setAttribute('products', JSON.stringify(this.products));
                }

                if (node.tagName.toLowerCase() === 'relewise-product-search-load-more-button') {
                    node.setAttribute('products-loaded', this.products.length.toString());
                    node.setAttribute('hits', this.searchResult?.hits.toString() ?? '');
                }

                if (node.tagName.toLowerCase() === 'relewise-facets') {
                    node.setAttribute('facets-result', JSON.stringify(this.searchResult?.facets));
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
        return html`
        <slot>
            <relewise-product-search-bar
                class="rw-product-search-bar"></relewise-product-search-bar>
            <div class="rw-sorting-button-container">
                <relewise-product-search-sorting class="rw-sorting-button"></relewise-product-search-sorting>
            </div>
            <div class="result-container">
                ${this.searchResult?.facets ? html`
                    <relewise-facets
                        .labels=${this.facetLabels}
                        .facetResult=${this.searchResult?.facets}
                        class="rw-facets">
                    </relewise-facets>
                `: nothing}
                <div class="rw-full-width">
                    <relewise-product-search-results
                        .products=${this.products}>
                    </relewise-product-search-results>
                    <relewise-product-search-load-more-button
                        class="rw-load-more"
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
            margin-top: var(--relewise-product-search-bar-margin-top, .5rem);
            margin-bottom: var(--relewise-product-search-bar-margin-bottom, .5rem);
        }

        .rw-sorting-button-container {
            display: var(--relewise-sorting-button-container-display, flex);
        }

        .rw-full-width {
            display: flex;
            flex-direction: column;
            width: 100%;
        }

        .rw-sorting-button {
            margin-bottom: .5rem;
        }

        .rw-load-more {
            margin: .5rem;
        }

        .rw-facets {
            display: flex;
            flex-direction: column;
            margin-bottom: .5rem;
        }

        @media (min-width: 1024px) {
            .result-container {
                display: flex;
                width: 100%;
            }

            .rw-facets {
                margin-right: .5rem;
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