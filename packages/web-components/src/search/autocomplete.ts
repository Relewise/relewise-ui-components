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
                ${this.term ? html`<div class="rw-clear-icon" @click=${() => this.term = ''}></div>`  : html`<div class="rw-search-icon"></div>`}
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