import { DoubleNullableRange, ProductResult, ProductSearchBuilder, ProductSearchResponse } from '@relewise/client';
import { LitElement, css, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { defaultProductProperties } from '../defaultProductProperties';
import { Events, getProductSearchResults, productSearchResults, productSearchSorting, readCurrentUrlState, readCurrentUrlStateValues, searhTermQueryName, updateUrlState } from '../helpers';
import { getRelewiseContextSettings, getRelewiseUIOptions, getRelewiseUISearchOptions } from '../helpers/relewiseUIOptions';
import { theme } from '../theme';
import { SortingEnum } from './enums';
import { getSearcher } from './searcher';

export class ProductSearch extends LitElement {
    
    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string = undefined;

    @property({ attribute: 'search-bar-placeholder' })
    searchBarPlaceholder: string | null = null;

    @property({ type: Number, attribute: 'search-result-page-size' })
    searchResultPageSize: number = 16;

    @property({ attribute: 'sales-price-ascending-sorting-option-text'})
    salesPriceAscendingText: string | null  = null;

    @property({ attribute: 'sales-price-decending-sorting-option-text'})
    salesPriceDescendingText: string | null  = null;

    @property({ attribute: 'alphabetically-ascending-sorting-option-text'})
    alphabeticallyAscendingText: string | null  = null;

    @property({ attribute: 'alphabetically-decending-sorting-option-text'})
    alphabeticallyDescendingText: string | null  = null;
    
    @property({ attribute: 'populartity-sorting-option-text'})
    popularityText: string  = 'Popularity';
    
    @property({ attribute: 'save-selected-number-range-text'})
    saveSelectedRangeText: string = 'Save';

    @state()
    term: string | null = null;

    @state()
    searchResult: ProductSearchResponse | null = null;

    @state()
    products: ProductResult[] = [];

    @state()
    showFacets: boolean = window.innerWidth >= 1024;

    @state()
    page: number = 1;

    async connectedCallback() {
        if (!this.displayedAtLocation) {
            console.error('No displayedAtLocation defined!');
        }

        this.term = readCurrentUrlState(searhTermQueryName) ?? null;
        
        const productsToFetch = getProductSearchResults();
        if (productsToFetch) {
            this.page = productsToFetch / this.searchResultPageSize;
        }
         
        this.search();

        window.addEventListener(Events.shouldPerformSearch, () => this.search());
        window.addEventListener(Events.shouldClearSearchResult, () => this.clearSearchResult());
        window.addEventListener(Events.shouldLoadMoreProducts, () => this.loadMoreProducts());
        super.connectedCallback();
    }

    clearSearchResult() {
        this.products = [];
        this.searchResult = null;
        this.page = 1;
        updateUrlState(productSearchResults, '');
    }
    
    loadMoreProducts() {
        this.page = this.page + 1;
        updateUrlState(productSearchResults, (this.searchResultPageSize * this.page).toString());
        this.search();
    }

    handleKeyDown(event: KeyboardEvent): void {
        switch (event.key) {
        case 'Enter':
            event.preventDefault();
            this.clearSearchResult();
            this.search();
            break;
        }
    }

    async search() {
        updateUrlState(searhTermQueryName, this.term ?? '');

        const productsToFetch = getProductSearchResults();

        const relewiseUIOptions = getRelewiseUIOptions();
        const searchOptions = getRelewiseUISearchOptions();
        const settings = getRelewiseContextSettings(this.displayedAtLocation ? this.displayedAtLocation : 'Relewise Product Search Overlay');
        const searcher = getSearcher(relewiseUIOptions);

        const requestBuilder = new ProductSearchBuilder(settings)
            .setSelectedProductProperties(relewiseUIOptions.selectedPropertiesSettings?.product ?? defaultProductProperties)
            .setTerm(this.term  ? this.term : null)
            .pagination(p => p
                .setPageSize(productsToFetch && this.products.length < 1 ? productsToFetch : this.searchResultPageSize)
                .setPage(productsToFetch && this.products.length < 1 ? 1 : this.page))
            .filters(builder => {
                if (relewiseUIOptions.filters?.product) {
                    relewiseUIOptions.filters.product(builder);
                }
                if (searchOptions && searchOptions.filters?.productSearch) {
                    searchOptions.filters.productSearch(builder);
                }
            })
            .facets(builder => {
                if (!searchOptions || !searchOptions.facets) {
                    return;
                }

                searchOptions.facets.facetBuilder(builder, readCurrentUrlStateValues(''));
            })
            .sorting(builder => {
                const sorting = readCurrentUrlState(productSearchSorting);
                const sortingEnum = SortingEnum[sorting as keyof typeof SortingEnum];
                
                if (!sortingEnum) {
                    return;
                }

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
                case SortingEnum.Popularity:
                    builder.sortByProductPopularity('Descending', (n) => n.sortByProductRelevance());
                    break;
                }

            });

        const request = requestBuilder.build();
        
        if (request.facets) {
            request.facets.items.forEach(facet => {
                if ('selected' in facet) {
                    if (facet.$type.includes('ProductAssortmentFacet')) {
                        facet.selected = readCurrentUrlStateValues(facet.field);    
                    }

                    if (facet.$type.includes('ProductDataDoubleRangeFacet') ||
                        facet.$type.includes('PriceRangeFacet')) {
                        let upperBound = null;
                        let lowerBound = null;
                        
                        if ('key' in facet) {
                            upperBound = readCurrentUrlState(facet.field + facet.key + 'upperbound');
                            lowerBound = readCurrentUrlState(facet.field + facet.key + 'lowerbound');
                        } else {
                            upperBound = readCurrentUrlState(facet.field + 'upperbound');
                            lowerBound = readCurrentUrlState(facet.field + 'lowerbound');
                        }

                        facet.selected = {
                        
                            lowerBoundInclusive: lowerBound ? +lowerBound : null,
                            upperBoundInclusive: upperBound ? +upperBound : null,
                        };
                    }

                    if (facet.$type.includes('BrandFacet') ||
                        facet.$type.includes('CategoryFacet')) {
                        facet.selected = readCurrentUrlStateValues(facet.field);
                    }

                    if ((facet.$type.includes('ProductDataStringValueFacet') ||
                        facet.$type.includes('ProductDataBooleanValueFacet')) && 
                        'key' in facet) {
                        facet.selected = readCurrentUrlStateValues(facet.field + facet.key);
                    }
                    console.log(facet.$type);
                    if (facet.$type.includes('PriceRangesFacet') || 
                        facet.$type.includes('ProductDataDoubleRangesFacet')) {
                        let queryValues = null;
                        if ('key' in facet) {
                            queryValues = readCurrentUrlStateValues(facet.field + facet.key); 
                        } else {
                            queryValues = readCurrentUrlStateValues(facet.field);
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
            });
        }

        const response = await searcher.searchProducts(request);
        if (!response) {
            return;
        } 

        this.searchResult = response;
        this.products = this.products.concat(response.results ?? []);

        this.setSearchResultOnSlotChilderen();
    }
    
    setSearchResultOnSlotChilderen() {
        const slot = this.renderRoot.querySelector('slot');
        if (slot) {
            const assignedNodes = slot.assignedNodes();

            assignedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE && node instanceof HTMLElement) {
                    const element = node as HTMLElement;
                    if (element.tagName.toLowerCase() === 'relewise-product-search-results') {
                        element.setAttribute('products', JSON.stringify(this.products));
                    }

                    if (element.tagName.toLowerCase() === 'relewise-product-search-load-more-button') {
                        element.setAttribute('products-loaded', this.products.length.toString());
                        element.setAttribute('hits', this.searchResult?.hits.toString() ?? '');
                    }

                    if (element.tagName.toLowerCase() === 'relewise-facets') {
                        element.setAttribute('facets-result', JSON.stringify(this.searchResult?.facets));                    
                    }
                }
            });
        }
    }

    render() {
        return html`
        <div class="rw-search-bar-container">
            <relewise-search-bar 
                .term=${this.term ?? ''}
                .setSearchTerm=${(term: string)=> this.term = term}
                .placeholder=${this.searchBarPlaceholder}
                .handleKeyEvent=${(e: KeyboardEvent) => this.handleKeyDown(e)}
                class="rw-search-bar">
            </relewise-search-bar>
            <relewise-button
                class="rw-button"
                button-text="Search"
                .handleClick=${() => this.search()}>
                <relewise-search-icon></relewise-search-icon>
            </relewise-button>
        </div>
        <slot>
            <div class="rw-options-buttons">
                <relewise-product-search-sorting
                    class="rw-sorting-button"
                    .alphabeticallyAscendingText=${this.alphabeticallyAscendingText}
                    .alphabeticallyDescendingText=${this.alphabeticallyDescendingText}
                    .salesPriceAscendingText=${this.salesPriceAscendingText}
                    .salesPriceDescendingText=${this.salesPriceDescendingText}
                    .popularityText=${this.popularityText}>
                </relewise-product-search-sorting>
            </div>
            <div class="rw-product-search-results">
                <div>
                    <relewise-facets
                        .facetResult=${this.searchResult?.facets}
                        .saveSelectedRangeText=${this.saveSelectedRangeText}></relewise-facets>
                </div>
                <div>
                    <relewise-product-search-results
                        .products=${this.products}>
                    </relewise-product-search-results>
                    <relewise-product-search-load-more-button
                        class="rw-center"
                        .productsLoaded=${this.products.length}
                        .hits=${this.searchResult?.hits ?? null}
                    ></relewise-product-search-load-more-button>
                </div>
            </div>
        </slot>
        `;
    }

    static styles = [theme, css`
        :host {
            font-family: var(--font);
        }

        .rw-search-bar-container {
            display: flex;
            margin-top: 1rem;
            margin-bottom: 1rem;
        }
        
        .rw-search-bar {
            width: 100%;
            margin-right: .5rem;
            --color: var(--accent-color);
        }

        .rw-options-buttons {
            display: flex;
        }

        .rw-sorting-button {
            margin-left: auto;
            --relewise-sorting-options-right: .5rem;
        }

        .rw-filter-container {
            background-color: lightgray;
            border-radius: 1rem;
            margin-bottom: 1rem;
            margin-top: 1rem;
            padding: .25rem;
            height: fit-content;
        }
        
        .rw-facet-item {
            margin-bottom: .5rem;
            margin-top: .5rem;
            margin-right: .5rem;
            width: 16rem;
        }

        .rw-center {
            justify-content: center;
            display: flex;
        }

        @media (min-width: 1024px) {
            .rw-product-search-results {
                display: grid;
                grid-template-columns: 1fr 4fr;
            }
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-search': ProductSearch;
    }
}