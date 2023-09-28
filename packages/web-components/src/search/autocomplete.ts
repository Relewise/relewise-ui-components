import { ProductResult, ProductSearchBuilder, ProductSearchResponse, SearchCollectionBuilder, SearchTermPredictionBuilder, SearchTermPredictionResponse, SearchTermPredictionResult } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { defaultProductProperties } from '../defaultProductProperties';
import { getRelewiseContextSettings, getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { getSearcher } from './searcher';

export class Autocomplete extends LitElement {
    
    @property({attribute: 'displayed-at-location'})
    displayedAtLocation?: string = undefined;

    @state()
    products: ProductResult[] | null = null;

    @state()
    searchTermPredictions: SearchTermPredictionResult[] | null = null;

    @state()
    searchBarInFocus: boolean = false;

    @state()
    resultBoxIsHovered: boolean = false;

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

    handleResultBoxHover = () => {
        this.resultBoxIsHovered = true;
    };
    
    handleResultBoxMouseLeave = () => {
        this.resultBoxIsHovered = false;
    };

    async search(searchTerm: string) {
        const relewiseUIOptions = getRelewiseUIOptions();
        const settings = getRelewiseContextSettings(this.displayedAtLocation ?? '');
        const searcher = getSearcher(relewiseUIOptions);
        const request = new SearchCollectionBuilder()
            .addRequest(new ProductSearchBuilder(settings)
                .setSelectedProductProperties(relewiseUIOptions.selectedPropertiesSettings?.product ?? defaultProductProperties)
                .setTerm(searchTerm)
                .pagination(p => p.setPageSize(3))
                .build())
            .addRequest(new SearchTermPredictionBuilder(settings)
                .setTerm(searchTerm)
                .take(10)
                .build())
            .build();

        const response = await searcher.batch(request);
        if (response && response.responses) {
            const productSearchResult = response.responses[0] as ProductSearchResponse
            this.products = productSearchResult.results ?? null;

            const searchTermPredictionResult = response.responses[1] as SearchTermPredictionResponse
            this.searchTermPredictions = searchTermPredictionResult.predictions ?? null;
        }
    }

    render() {
        return html`
        <div class="rw-search-bar-container">
            <div class="rw-search-bar" >
                <input class="rw-search-bar-input" type="text" .value=${this.term} @input=${(e: InputEvent) => this.setSearchTerm((e.target as HTMLInputElement).value)} @focus=${() => this.searchBarInFocus = true} @blur=${() => this.searchBarInFocus = false}>
                <div class="rw-search-icon"><svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="20" height="20" viewBox="0 0 50 50">
                <path d="M 21 3 C 11.621094 3 4 10.621094 4 20 C 4 29.378906 11.621094 37 21 37 C 24.710938 37 28.140625 35.804688 30.9375 33.78125 L 44.09375 46.90625 L 46.90625 44.09375 L 33.90625 31.0625 C 36.460938 28.085938 38 24.222656 38 20 C 38 10.621094 30.378906 3 21 3 Z M 21 5 C 29.296875 5 36 11.703125 36 20 C 36 28.296875 29.296875 35 21 35 C 12.703125 35 6 28.296875 6 20 C 6 11.703125 12.703125 5 21 5 Z"></path>
                </svg></div>            
            </div>
            ${(this.searchBarInFocus || this.resultBoxIsHovered) && this.term ? 
                html`
                    <div class="rw-result-container" @mouseover=${() => this.resultBoxIsHovered = true} @mouseleave=${() => this.resultBoxIsHovered = false}>
                        ${this.searchTermPredictions && this.searchTermPredictions.length > 0 ? html`
                        <div class="rw-term-prediction-container">
                                ${this.searchTermPredictions.map(term =>
                                    html`
                                    <div>
                                        <button @click=${() => this.setSearchTerm(term.term ?? '')}>
                                            ${term.term}
                                        </button>
                                    </div>`,
                                )}
                        </div>
                        ` : nothing}
                        <div class="vl"></div>
                        ${this.products && this.products.length > 0 ? html`
                                <div class="rw-products-container">
                                    ${this.products.map(product =>
                                        html`<relewise-product-search-result-tile .product=${product}></relewise-product-search-result-tile>`,
                                    )}
                                </div>
                        ` : nothing}
                        
                    </div>
                ` : nothing
            }
        </div>
        `
    }

    static styles = css`
        .rw-search-bar-container {
            max-width: 50%;
            font-family: var(--relewise-font, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji");
        }

        .rw-search-bar {
            position: relative;
            box-sizing: border-box;
            background-color: #d8d8db;
            border-radius: 28px;
            border: 1px;
            color: #000;
            height: 56px;
            display: flex;
            align-items: center;
            padding-left: 30px;
        }

        .rw-search-bar-input {
            all: unset;
            flex: 1; /* Take up remaining space */
            max-width: calc(100% - 46px); /* Adjust max-width to leave space for the icon */
        }

        .rw-search-icon {
            position: absolute;
            background-repeat: no-repeat;
            background-position: center;
            right: 2px;
            top: 50%; /* Position it vertically at the middle of the search bar */
            transform: translateY(-50%); /* Correct its vertical position */
            width: 46px;
            height: 46px; /* Set a fixed height for the icon */
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        }

        .rw-search-bar:focus {
            border: .2rem solid #7a7777;
        }

        .rw-result-container {
            padding: 1rem;
            position: absolute;
            z-index: 99;
            width: 50rem;
            background-color: white;
            box-shadow: 0 10px 15px rgb(0 0 0 / 0.2);
            overflow-y: auto;
            display: grid;
            grid-template-columns: 30% 2% 68%; 
        }

        .rw-term-prediction-container {
            flex-grow: 14;
        }

        .rw-products-container {
            flex-grow: 4;
            display:flex;
            flex-direction: column;
        }

        .vl {
            border-left: 2px solid lightgray;
        }
    `;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-autocomplete': Autocomplete;
    }
}