import { ProductResult, ProductSearchBuilder, ProductSearchResponse, SearchCollectionBuilder } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { getRelewiseContextSettings, getRelewiseUIOptions, getRelewiseUISearchOptions } from '../helpers/relewiseUIOptions';
import { defaultProductProperties } from '../defaultProductProperties';
import { theme } from '../theme';
import { getSearcher } from './searcher';

export class ProductSearch extends LitElement {
    
    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string = undefined;

    @property({ attribute: 'search-bar-placeholder' })
    searchBarPlaceholder: string | null = null;

    @state()
    term: string = '';

    @state()
    products: ProductResult[] | null | undefined;

    async connectedCallback() {
        if (!this.displayedAtLocation) {
            console.error('No displayedAtLocation defined!');
        }

        super.connectedCallback();
    }

    handleKeyDown(event: KeyboardEvent): void {
        switch (event.key) {
        case 'Enter':
            event.preventDefault();
            this.search();
            break;
        }
    }

    async search() {
        const relewiseUIOptions = getRelewiseUIOptions();
        const searchOptions = getRelewiseUISearchOptions();
        const settings = getRelewiseContextSettings(this.displayedAtLocation ? this.displayedAtLocation : 'Relewise Product Search Overlay');
        const searcher = getSearcher(relewiseUIOptions);
        const requestBuilder = new SearchCollectionBuilder()
            .addRequest(new ProductSearchBuilder(settings)
                .setSelectedProductProperties(relewiseUIOptions.selectedPropertiesSettings?.product ?? defaultProductProperties)
                .setTerm(this.term)
                .pagination(p => p.setPageSize(20))
                .filters(builder => {
                    if (relewiseUIOptions.filters?.product) {
                        relewiseUIOptions.filters.product(builder);
                    }
                    if (searchOptions && searchOptions.filters?.productSearch) {
                        searchOptions.filters.productSearch(builder);
                    }
                })
                .build());

        const response = await searcher.batch(requestBuilder.build());
        if (response && response.responses) {
            const productSearchResult = response.responses[0] as ProductSearchResponse;
            this.products = productSearchResult.results;
        }
    }

    render() {
        return html`
        <div class="rw-search-bar-container">
            <relewise-search-bar 
                .term=${this.term}
                .setSearchTerm=${(term: string)=> this.term = term}
                .placeholder=${this.searchBarPlaceholder}
                .handleKeyEvent=${(e: KeyboardEvent) => this.handleKeyDown(e)}
                class="rw-search-bar">
            </relewise-search-bar>
            <relewise-button 
                button-text="Search"
                .handleClick=${() => this.search()}>
                <relewise-search-icon name="icon"></relewise-search-icon>
            </relewise-button>
        </div>
        <div class="rw-grid">
            ${this.products ? html`
                ${this.products.map(product =>
                    html`<relewise-product-tile .product=${product}></relewise-product-tile>`)
                }
            ` : nothing}
        </div>
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
        }
        
        .rw-grid {
            display: grid;
            grid-template-columns: repeat(4,1fr);
            gap: 1rem;
            grid-auto-rows: 1fr;
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-search': ProductSearch;
    }
}