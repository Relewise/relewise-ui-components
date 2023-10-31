import { BrandFacet, CategoryFacet, CategoryHierarchyFacet, ContentAssortmentFacet, ContentDataBooleanValueFacet, ContentDataDoubleRangeFacet, ContentDataDoubleRangesFacet, ContentDataDoubleValueFacet, ContentDataIntegerValueFacet, ContentDataObjectFacet, ContentDataStringValueFacet, DataObjectBooleanValueFacet, DataObjectDoubleRangeFacet, DataObjectDoubleRangesFacet, DataObjectDoubleValueFacet, DataObjectFacet, DataObjectStringValueFacet, DoubleNullableRange, PriceRangeFacet, PriceRangesFacet, ProductAssortmentFacet, ProductCategoryAssortmentFacet, ProductCategoryDataBooleanValueFacet, ProductCategoryDataDoubleRangeFacet, ProductCategoryDataDoubleRangesFacet, ProductCategoryDataDoubleValueFacet, ProductCategoryDataObjectFacet, ProductCategoryDataStringValueFacet, ProductDataBooleanValueFacet, ProductDataDoubleRangeFacet, ProductDataDoubleRangesFacet, ProductDataDoubleValueFacet, ProductDataIntegerValueFacet, ProductDataObjectFacet, ProductDataStringValueFacet, ProductResult, ProductSearchBuilder, ProductSearchResponse, VariantSpecificationFacet } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { defaultProductProperties } from '../defaultProductProperties';
import { Events, QueryKeys, getNumberOfProductSearchResults, readCurrentUrlState, readCurrentUrlStateValues, updateUrlState } from '../helpers';
import { getRelewiseContextSettings, getRelewiseUIOptions, getRelewiseUISearchOptions } from '../helpers/relewiseUIOptions';
import { theme } from '../theme';
import { SortingEnum } from './enums';
import { getSearcher } from './searcher';
import { RelewiseUISearchOptions } from 'src';

export class ProductSearch extends LitElement {
    
    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string = undefined;

    @property({ type: Number, attribute: 'search-result-page-size' })
    searchResultPageSize: number = 16;

    @state()
    searchResult: ProductSearchResponse | null = null;

    @state()
    products: ProductResult[] = [];

    @state()
    page: number = 1;

    @state()
    searchOptions: RelewiseUISearchOptions | undefined | null = null;

    async connectedCallback() {
        if (!this.displayedAtLocation) {
            console.error('No displayedAtLocation defined!');
        }

        this.searchOptions = getRelewiseUISearchOptions();

        const productsToFetch = getNumberOfProductSearchResults();
        if (productsToFetch) {
            this.page = productsToFetch / this.searchResultPageSize;
        }
         
        this.search(false);

        window.addEventListener(Events.search, () => {
            this.page = this.page + 1;
            updateUrlState(QueryKeys.take, (this.searchResultPageSize * this.page).toString());
            this.search(true);
        });
        
        window.addEventListener(Events.loadMoreProducts, () => this.search(false));

        if (this.searchOptions?.rememberScrollPosition) {
            window.addEventListener('scroll', async() => 
                sessionStorage.setItem('relewise-scroll-position', window.scrollY.toString())); 
        }

        super.connectedCallback();
    }
    
    async search(shouldClearOldResult: boolean) {

        if (shouldClearOldResult) {
            window.dispatchEvent(new CustomEvent(Events.dimPreviousResult));
            this.page = 1;
            updateUrlState(QueryKeys.take, null);
        } else {
            window.dispatchEvent(new CustomEvent(Events.showLoadingSpinner));
        }

        const term = readCurrentUrlState(QueryKeys.term) ?? null;

        const numberOfProductsToFetch = getNumberOfProductSearchResults();

        const relewiseUIOptions = getRelewiseUIOptions();
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
                if (this.searchOptions && this.searchOptions.filters?.productSearch) {
                    this.searchOptions.filters.productSearch(builder);
                }
            })
            .facets(builder => {
                if (this.searchOptions && this.searchOptions.facets) {
                    this.searchOptions.facets.facetBuilder(builder);
                }
            })
            .sorting(builder => {
                const sorting = readCurrentUrlState(QueryKeys.sortBy);
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

        if (shouldClearOldResult) {
            this.products = [];
            this.searchResult = null;
        }

        this.searchResult = response;
        this.products = this.products.concat(response.results ?? []);

        this.setSearchResultOnSlotChilderen();
        window.dispatchEvent(new CustomEvent(Events.searchingForProductsCompleted));
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
            this.setDataOnNodes(assignedNodes);
        }
    }

    setDataOnNodes(nodes: Node[]) {
        nodes.forEach((node) => {
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

                if (element.children.length > 0) {
                    this.setDataOnNodes(Array.from(element.childNodes));
                }
            }
        });
    }

    async updated() {
        if (!this.searchOptions?.rememberScrollPosition) {
            return;
        }

        const valueFromStorage = sessionStorage.getItem('relewise-scroll-position');
        if (!valueFromStorage || +valueFromStorage === window.scrollY) {
            return;
        }

        // Ensure render completed before scrolling
        setTimeout(() => window.scrollTo(0, +valueFromStorage), 0);
    }
      
    render() {
        return html`
        <slot>
            <relewise-product-search-bar></relewise-product-search-bar>
            <div class="rw-options-buttons">
                <relewise-product-search-sorting class="rw-sorting-button"></relewise-product-search-sorting>
            </div>
            <div class="result-container">
                ${this.searchResult?.facets ? html`
                    <relewise-facets .facetResult=${this.searchResult?.facets}></relewise-facets>
                `: nothing}
                <div class="rw-full-width">
                    <relewise-product-search-results class="rw-full-width" .products=${this.products}></relewise-product-search-results>
                    <relewise-product-search-load-more-button
                        class="rw-center"
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

        .rw-full-width {
            display: flex;
            flex-direction: column;
            width: 100%;
        }

        @media (min-width: 1024px) {
            .result-container {
                display: flex;
                width: 100%;
            }
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-search': ProductSearch;
    }
}