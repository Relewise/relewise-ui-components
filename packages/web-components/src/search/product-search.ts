import { BrandFacet, CategoryFacet, CategoryHierarchyFacet, ContentAssortmentFacet, ContentDataBooleanValueFacet, ContentDataDoubleRangeFacet, ContentDataDoubleRangesFacet, ContentDataDoubleValueFacet, ContentDataIntegerValueFacet, ContentDataObjectFacet, ContentDataStringValueFacet, DataObjectBooleanValueFacet, DataObjectDoubleRangeFacet, DataObjectDoubleRangesFacet, DataObjectDoubleValueFacet, DataObjectFacet, DataObjectStringValueFacet, DoubleNullableRange, PriceRangeFacet, PriceRangesFacet, ProductAssortmentFacet, ProductCategoryAssortmentFacet, ProductCategoryDataBooleanValueFacet, ProductCategoryDataDoubleRangeFacet, ProductCategoryDataDoubleRangesFacet, ProductCategoryDataDoubleValueFacet, ProductCategoryDataObjectFacet, ProductCategoryDataStringValueFacet, ProductDataBooleanValueFacet, ProductDataDoubleRangeFacet, ProductDataDoubleRangesFacet, ProductDataDoubleValueFacet, ProductDataIntegerValueFacet, ProductDataObjectFacet, ProductDataStringValueFacet, ProductResult, ProductSearchBuilder, ProductSearchResponse, VariantSpecificationFacet } from '@relewise/client';
import { LitElement, css, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { defaultProductProperties } from '../defaultProductProperties';
import { Events, getNumberOfProductSearchResults, numberOfProductSearchResults, productSearchSorting, readCurrentUrlState, readCurrentUrlStateValues, searhTermQueryName, updateUrlState } from '../helpers';
import { getRelewiseContextSettings, getRelewiseUIOptions, getRelewiseUISearchOptions } from '../helpers/relewiseUIOptions';
import { theme } from '../theme';
import { SortingEnum } from './enums';
import { getSearcher } from './searcher';

export class ProductSearch extends LitElement {
    
    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string = undefined;

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
    searchResult: ProductSearchResponse | null = null;

    @state()
    products: ProductResult[] = [];

    @state()
    page: number = 1;

    async connectedCallback() {
        if (!this.displayedAtLocation) {
            console.error('No displayedAtLocation defined!');
        }

        const productsToFetch = getNumberOfProductSearchResults();
        if (productsToFetch) {
            this.page = productsToFetch / this.searchResultPageSize;
        }
         
        this.search();

        window.addEventListener(Events.search, () => {
            this.clearSearchResult();
            this.search();
        });
        window.addEventListener(Events.loadMoreProducts, () => this.loadMoreProducts());
        super.connectedCallback();
    }

    clearSearchResult() {
        this.products = [];
        this.searchResult = null;
        this.page = 1;
        updateUrlState(numberOfProductSearchResults, '');
    }
    
    loadMoreProducts() {
        this.page = this.page + 1;
        updateUrlState(numberOfProductSearchResults, (this.searchResultPageSize * this.page).toString());
        this.search();
    }

    async search() {
        const term = readCurrentUrlState(searhTermQueryName) ?? null;

        const numberOfProductsToFetch = getNumberOfProductSearchResults();

        const relewiseUIOptions = getRelewiseUIOptions();
        const searchOptions = getRelewiseUISearchOptions();
        const settings = getRelewiseContextSettings(this.displayedAtLocation ? this.displayedAtLocation : 'Relewise Product Search Overlay');
        const searcher = getSearcher(relewiseUIOptions);

        const requestBuilder = new ProductSearchBuilder(settings)
            .setSelectedProductProperties(relewiseUIOptions.selectedPropertiesSettings?.product ?? defaultProductProperties)
            .setTerm(term  ? term : null)
            .pagination(p => p
                .setPageSize(numberOfProductsToFetch && this.products.length < 1 ? numberOfProductsToFetch : this.searchResultPageSize)
                .setPage(numberOfProductsToFetch && this.products.length < 1 ? 1 : this.page))
            .filters(builder => {
                if (relewiseUIOptions.filters?.product) {
                    relewiseUIOptions.filters.product(builder);
                }
                if (searchOptions && searchOptions.filters?.productSearch) {
                    searchOptions.filters.productSearch(builder);
                }
            })
            .facets(builder => {
                if (searchOptions && searchOptions.facets) {
                    searchOptions.facets.facetBuilder(builder, readCurrentUrlStateValues(''));
                }
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
                this.getSelectedValuesForFacet(facet);
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

    getSelectedValuesForFacet(facet: ContentAssortmentFacet | ProductAssortmentFacet | ProductCategoryAssortmentFacet | BrandFacet | CategoryFacet | CategoryHierarchyFacet | ContentDataObjectFacet | ContentDataDoubleRangeFacet | ContentDataDoubleRangesFacet | ContentDataStringValueFacet | ContentDataBooleanValueFacet | ContentDataDoubleValueFacet | ContentDataIntegerValueFacet | DataObjectFacet | DataObjectDoubleRangeFacet | DataObjectDoubleRangesFacet | DataObjectStringValueFacet | DataObjectBooleanValueFacet | DataObjectDoubleValueFacet | PriceRangeFacet | PriceRangesFacet | ProductCategoryDataObjectFacet | ProductCategoryDataDoubleRangeFacet | ProductCategoryDataDoubleRangesFacet | ProductCategoryDataStringValueFacet | ProductCategoryDataBooleanValueFacet | ProductCategoryDataDoubleValueFacet | ProductDataObjectFacet | ProductDataDoubleRangeFacet | ProductDataDoubleRangesFacet | ProductDataStringValueFacet | ProductDataBooleanValueFacet | ProductDataDoubleValueFacet | ProductDataIntegerValueFacet | VariantSpecificationFacet) {
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
    }

    getSelectedRange(facet: ContentAssortmentFacet | ProductAssortmentFacet | ProductCategoryAssortmentFacet | BrandFacet | CategoryFacet | CategoryHierarchyFacet | ContentDataObjectFacet | ContentDataDoubleRangeFacet | ContentDataDoubleRangesFacet | ContentDataStringValueFacet | ContentDataBooleanValueFacet | ContentDataDoubleValueFacet | ContentDataIntegerValueFacet | DataObjectFacet | DataObjectDoubleRangeFacet | DataObjectDoubleRangesFacet | DataObjectStringValueFacet | DataObjectBooleanValueFacet | DataObjectDoubleValueFacet | PriceRangeFacet | PriceRangesFacet | ProductCategoryDataObjectFacet | ProductCategoryDataDoubleRangeFacet | ProductCategoryDataDoubleRangesFacet | ProductCategoryDataStringValueFacet | ProductCategoryDataBooleanValueFacet | ProductCategoryDataDoubleValueFacet | ProductDataObjectFacet | ProductDataDoubleRangeFacet | ProductDataDoubleRangesFacet | ProductDataStringValueFacet | ProductDataBooleanValueFacet | ProductDataDoubleValueFacet | ProductDataIntegerValueFacet | VariantSpecificationFacet) {
        if ('selected' in facet) { 
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
    }

    getSelectedRanges(facet: ContentAssortmentFacet | ProductAssortmentFacet | ProductCategoryAssortmentFacet | BrandFacet | CategoryFacet | CategoryHierarchyFacet | ContentDataObjectFacet | ContentDataDoubleRangeFacet | ContentDataDoubleRangesFacet | ContentDataStringValueFacet | ContentDataBooleanValueFacet | ContentDataDoubleValueFacet | ContentDataIntegerValueFacet | DataObjectFacet | DataObjectDoubleRangeFacet | DataObjectDoubleRangesFacet | DataObjectStringValueFacet | DataObjectBooleanValueFacet | DataObjectDoubleValueFacet | PriceRangeFacet | PriceRangesFacet | ProductCategoryDataObjectFacet | ProductCategoryDataDoubleRangeFacet | ProductCategoryDataDoubleRangesFacet | ProductCategoryDataStringValueFacet | ProductCategoryDataBooleanValueFacet | ProductCategoryDataDoubleValueFacet | ProductDataObjectFacet | ProductDataDoubleRangeFacet | ProductDataDoubleRangesFacet | ProductDataStringValueFacet | ProductDataBooleanValueFacet | ProductDataDoubleValueFacet | ProductDataIntegerValueFacet | VariantSpecificationFacet) {
        if ('selected' in facet) { 
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

    getSelectedStrings(facet: ContentAssortmentFacet | ProductAssortmentFacet | ProductCategoryAssortmentFacet | BrandFacet | CategoryFacet | CategoryHierarchyFacet | ContentDataObjectFacet | ContentDataDoubleRangeFacet | ContentDataDoubleRangesFacet | ContentDataStringValueFacet | ContentDataBooleanValueFacet | ContentDataDoubleValueFacet | ContentDataIntegerValueFacet | DataObjectFacet | DataObjectDoubleRangeFacet | DataObjectDoubleRangesFacet | DataObjectStringValueFacet | DataObjectBooleanValueFacet | DataObjectDoubleValueFacet | PriceRangeFacet | PriceRangesFacet | ProductCategoryDataObjectFacet | ProductCategoryDataDoubleRangeFacet | ProductCategoryDataDoubleRangesFacet | ProductCategoryDataStringValueFacet | ProductCategoryDataBooleanValueFacet | ProductCategoryDataDoubleValueFacet | ProductDataObjectFacet | ProductDataDoubleRangeFacet | ProductDataDoubleRangesFacet | ProductDataStringValueFacet | ProductDataBooleanValueFacet | ProductDataDoubleValueFacet | ProductDataIntegerValueFacet | VariantSpecificationFacet) {
        if ('selected' in facet) { 
            let queryValues = null;
            if ('key' in facet) {
                queryValues = readCurrentUrlStateValues(facet.field + facet.key); 
            } else {
                queryValues = readCurrentUrlStateValues(facet.field);
            }
            facet.selected = queryValues;
        }
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
        <slot>
            <relewise-product-search-bar></relewise-product-search-bar>
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

        .rw-options-buttons {
            display: flex;
        }

        .rw-sorting-button {
            margin-left: auto;
            --relewise-sorting-options-right: .5rem;
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