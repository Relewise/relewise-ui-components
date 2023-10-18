import { ProductResult, ProductSearchBuilder, ProductSearchResponse } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { defaultProductProperties } from '../defaultProductProperties';
import { Events, categoryFacetQueryName, getProductSearchResults, productSearchResults, readCurrentUrlState, readCurrentUrlStateValues, searhTermQueryName, updateUrlState } from '../helpers';
import { getRelewiseContextSettings, getRelewiseUIOptions, getRelewiseUISearchOptions } from '../helpers/relewiseUIOptions';
import { theme } from '../theme';
import { getSearcher } from './searcher';

export class ProductSearch extends LitElement {
    
    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string = undefined;

    @property({ attribute: 'search-bar-placeholder' })
    searchBarPlaceholder: string | null = null;

    @property({ type: Number, attribute: 'search-result-page-size' })
    searchResultPageSize: number = 16;

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
                if (searchOptions && searchOptions.facets && searchOptions.facets.categoryFacet) {
                    searchOptions.facets.categoryFacet(builder, readCurrentUrlStateValues(categoryFacetQueryName));
                }
            });

        const response = await searcher.searchProducts(requestBuilder.build());
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

                    if (element.tagName.toLowerCase().startsWith('relewise-') &&
                        element.tagName.toLowerCase().endsWith('-facet')) {
                        element.setAttribute('search-result', JSON.stringify(this.searchResult));                    
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
                class="rw-search-button"
                button-text="Search"
                .handleClick=${() => this.search()}>
                <relewise-search-icon></relewise-search-icon>
            </relewise-button>
        </div>
        <slot>
        <div class="rw-product-search-results">
            <div class="rw-facet-container">
                <relewise-button
                        button-text="Filter" 
                        class="rw-filter-button"
                        @click=${() => this.showFacets = !this.showFacets}>
                            ${this.showFacets ?
                                html`<relewise-x-icon class="rw-filter-icon-color"></relewise-x-icon>` :
                                html`<relewise-filter-icon class="rw-filter-icon-color"></relewise-filter-icon>`}
                </relewise-button>
                ${this.showFacets ? 
                    html`
                        <relewise-category-facet .searchResult=${this.searchResult}></relewise-category-facet>
                    ` : nothing}
                </div>
                <div>
                    <relewise-product-search-results
                        .products=${this.products}>
                    </relewise-product-search-results>
                    <relewise-product-search-load-more-button
                        .productsLoaded=${this.products.length}
                        .hits=${this.searchResult?.hits ?? null}
                    ></relewise-product-search-load-more-button>
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

        .rw-search-button {
            height: 3.25rem;
            border: 2px solid;
            border-color: var(--accent-color);
            border-radius: 1rem;
            background-color: var(--accent-color);
        }

        @media (min-width: 1024px) {
            .rw-product-search-results {
                display: grid;
                grid-template-columns: 1fr 4fr;
            }
        }

        .rw-filter-button {
            margin: 0;
            padding: 0;
            --relewise-button-icon-padding: 0;
            --relewise-button-text-color: black;
            --relewise-button-text-font-weight: 700;
            width: 100%;
        }

        .rw-filter-icon-color {
            display: flex;
            margin: .5rem;
            --relewise-icon-color: black;
        }
       
        @media (min-width: 1024px) {
            .rw-facet-container {
                background-color: lightgray;
                border-radius: 1rem;
                margin-right: 1rem;
                height: fit-content;
            }
        }

        .rw-facet-container {
            background-color: lightgray;
            border-radius: 1rem;
            margin-bottom: 1rem;
            margin-top: 1rem;
            padding: .25rem;
            height: fit-content;
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-search': ProductSearch;
    }
}