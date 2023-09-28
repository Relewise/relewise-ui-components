import { ProductResult, ProductSearchBuilder, ProductSearchResponse, SearchCollectionBuilder, SearchTermPredictionBuilder, SearchTermPredictionResponse, SearchTermPredictionResult } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { defaultProductProperties } from '../defaultProductProperties';
import { getRelewiseContextSettings, getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { getSearcher } from './searcher';
export class SearchBar extends LitElement {
    
    @property({attribute: 'displayed-at-location'})
    displayedAtLocation?: string = undefined;

    @state()
    products: ProductResult[] | null = null;

    @state()
    searchTermPredictions: SearchTermPredictionResult[] | null = null;

    @state()
    searchBarInFocus: boolean = false;

    @state()
    term: string = '';
    
    async connectedCallback() {
        if (!this.displayedAtLocation) {
            console.error('No displayedAtLocation defined!');
        }
        super.connectedCallback();
    }

    setSearchTerm(term: string) {
        this.term = term;
        
        if (!term) {
            this.products = null; 
            this.searchTermPredictions = null;
            return;
        }

        this.search(term);
    }

    async search(searchTerm: string) {
        const relewiseUIOptions = getRelewiseUIOptions();
        const settings = getRelewiseContextSettings(this.displayedAtLocation ?? '');
        const searcher = getSearcher(relewiseUIOptions);
        const request = new SearchCollectionBuilder()
            .addRequest(new ProductSearchBuilder(settings)
                .setSelectedProductProperties(relewiseUIOptions.selectedPropertiesSettings?.product ?? defaultProductProperties)
                .setTerm(searchTerm)
                .pagination(p => p.setPageSize(5))
                .build())
            .addRequest(new SearchTermPredictionBuilder(settings)
                .setTerm(searchTerm)
                .take(10)
                .build())
            .build();

        const response = await searcher.batch(request);
        if (response && response.responses) {
            const productSearchResult = response.responses[0] as ProductSearchResponse;
            this.products = productSearchResult.results ?? null;

            const searchTermPredictionResult = response.responses[1] as SearchTermPredictionResponse;
            this.searchTermPredictions = searchTermPredictionResult.predictions ?? null;
        }
    }

    render() {
        return html`
        <div class="rw-search-bar-container">
            <div class="rw-search-bar" >
                <input class="rw-search-bar-input" type="text" placeholder="Search" .value=${this.term} @input=${(e: InputEvent) => this.setSearchTerm((e.target as HTMLInputElement).value)} @focus=${() => this.searchBarInFocus = true} @blur=${() => this.searchBarInFocus = false}>
                ${this.term ? html`<div class="rw-clear-icon" @click=${() => this.term = ''}></div>`  : html`<div class="rw-search-icon"></div>`}
            </div>
            ${this.term ? 
                html`<relewise-product-search-bar-result-overlay
                    .searchBarInFocus=${this.searchBarInFocus}
                    .products=${this.products} 
                    .searchTermPredictions=${this.searchTermPredictions}
                    .setSearchTerm=${(term: string)=> this.setSearchTerm(term)}>
                    </relewise-product-search-bar-result-overlay> ` : nothing
            }
        </div>
        `;
    }

    static styles = css`

        .rw-search-bar-container {
            font-family: var(--relewise-font, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji");
        }

        .rw-search-bar {
            border-radius: 2rem;
            border: .25rem solid lightgrey;
            height: 3rem;
            display: flex;
            align-items: center;
            padding-left: 1rem;
        }

        .rw-search-bar-input {
            all: unset;
            max-width: calc(100% - 2rem); 
            min-width: calc(100% - 2rem);
            padding-right: .25rem;
        }

        .rw-search-bar-input::placeholder {
            color: lightgray;
        }

        .rw-search-icon {
            background-image: url(/src/icons/search-icon.svg);
            background-size: contain;
            background-repeat: no-repeat;
            width: 1rem;
            height: 1rem;
        }

        .rw-clear-icon {
            cursor: pointer;
            background-image: url(/src/icons/close-line-icon.svg);
            background-size: contain;
            background-repeat: no-repeat;
            width: 1rem;
            height: 1rem;
        }

        .rw-search-bar:focus {
            border: .2rem solid #7a7777;
        }
    `;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-search-bar': SearchBar;
    }
}