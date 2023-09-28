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
                <div class="rw-search-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 122.879 119.799" enable-background="new 0 0 122.879 119.799" xml:space="preserve"><g><path d="M49.988,0h0.016v0.007C63.803,0.011,76.298,5.608,85.34,14.652c9.027,9.031,14.619,21.515,14.628,35.303h0.007v0.033v0.04 h-0.007c-0.005,5.557-0.917,10.905-2.594,15.892c-0.281,0.837-0.575,1.641-0.877,2.409v0.007c-1.446,3.66-3.315,7.12-5.547,10.307 l29.082,26.139l0.018,0.016l0.157,0.146l0.011,0.011c1.642,1.563,2.536,3.656,2.649,5.78c0.11,2.1-0.543,4.248-1.979,5.971 l-0.011,0.016l-0.175,0.203l-0.035,0.035l-0.146,0.16l-0.016,0.021c-1.565,1.642-3.654,2.534-5.78,2.646 c-2.097,0.111-4.247-0.54-5.971-1.978l-0.015-0.011l-0.204-0.175l-0.029-0.024L78.761,90.865c-0.88,0.62-1.778,1.209-2.687,1.765 c-1.233,0.755-2.51,1.466-3.813,2.115c-6.699,3.342-14.269,5.222-22.272,5.222v0.007h-0.016v-0.007 c-13.799-0.004-26.296-5.601-35.338-14.645C5.605,76.291,0.016,63.805,0.007,50.021H0v-0.033v-0.016h0.007 c0.004-13.799,5.601-26.296,14.645-35.338C23.683,5.608,36.167,0.016,49.955,0.007V0H49.988L49.988,0z M50.004,11.21v0.007h-0.016 h-0.033V11.21c-10.686,0.007-20.372,4.35-27.384,11.359C15.56,29.578,11.213,39.274,11.21,49.973h0.007v0.016v0.033H11.21 c0.007,10.686,4.347,20.367,11.359,27.381c7.009,7.012,16.705,11.359,27.403,11.361v-0.007h0.016h0.033v0.007 c10.686-0.007,20.368-4.348,27.382-11.359c7.011-7.009,11.358-16.702,11.36-27.4h-0.006v-0.016v-0.033h0.006 c-0.006-10.686-4.35-20.372-11.358-27.384C70.396,15.56,60.703,11.213,50.004,11.21L50.004,11.21z"/></g></svg>
                </div>            
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

        .rw-search-icon {
            display: flex;
            color: lightgray;
            width: 1rem;
            height: 2rem;
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