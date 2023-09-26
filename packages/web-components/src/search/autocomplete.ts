import { ProductResult, ProductSearchBuilder, ProductSearchResponse, SearchCollectionBuilder, SearchTermPredictionBuilder, SearchTermPredictionResponse, SearchTermPredictionResult } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { defaultProductProperties } from '../defaultProductProperties';
import { getRelewiseContextSettings, getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { getSearcher } from './searcher';
import formatPrice from '../helpers/formatPrice';

export class Autocomplete extends LitElement {
    
    @property({attribute: 'displayed-at-location'})
    displayedAtLocation?: string = undefined;

    @state()
    products: ProductResult[] | null = null;

    @state()
    terms: SearchTermPredictionResult[] | null = null;

    @state()
    inFocus: boolean = false;
    
    async connectedCallback() {
        if (!this.displayedAtLocation) {
            console.error('No displayedAtLocation defined!');
        }
        super.connectedCallback();
    }

    async search(e: InputEvent) {
        const inputElement = e.target as HTMLInputElement;

        if (!inputElement.value) {
            this.products = null;
            this.terms = null;
            return;
        }

        const relewiseUIOptions = getRelewiseUIOptions();
        const settings = getRelewiseContextSettings(this.displayedAtLocation ?? '');
        const searcher = getSearcher(relewiseUIOptions);
        const request = new SearchCollectionBuilder()
            .addRequest(new ProductSearchBuilder(settings)
                .setSelectedProductProperties(relewiseUIOptions.selectedPropertiesSettings?.product ?? defaultProductProperties)
                .setTerm(inputElement.value)
                .pagination(p => p.setPageSize(3))
                .build())
            .addRequest(new SearchTermPredictionBuilder(settings)
                .setTerm(inputElement.value)
                .take(10)
                .build())
            .build();

        const response = await searcher.batch(request);
        if (response && response.responses) {
            const productSearchResult = response.responses[0] as ProductSearchResponse
            this.products = productSearchResult.results ?? null;

            const searchTermPredictionResult = response.responses[1] as SearchTermPredictionResponse
            this.terms = searchTermPredictionResult.predictions ?? null;
        }
    }

    render() {
        return html`
        <div class="rw-search-bar-container">
            <input class="rw-search-bar" type="text" @input=${(e: InputEvent) => this.search(e)} @focus=${() => this.inFocus = true} @blur=${() => this.inFocus = false}>
            ${this.inFocus && ((this.products && this.products.length > 0) || (this.terms && this.terms.length > 0)) ? 
                html`
                    <div class="rw-result-container">
                        ${this.terms ? html`
                        <div class="rw-term-prediction-container">
                                ${this.terms.map(term =>
                                    html`<div>${term.term}</div>`,
                                )}
                        </div>
                        ` : nothing}
                        <div class="vl"></div>
                        ${this.products ? html`
                                <div class="rw-products-container">
                                    ${this.products.map(product =>
                                        html`<div class="rw-product-result-tile">
                                        ${(product.data && 'ImageUrl' in product.data) ? 
                                            html`
                                                <img class="rw-product-image-container" src=${product.data['ImageUrl'].value} />
                                            `
                                        : nothing
                                    }
                                        <h4 class="rw-product-result-display-name">${product.displayName}</h4>
                                        <div class='rw-product-result-price'>
                                            <div>
                                                <span class="rw-product-result-sales-price">${formatPrice(product.salesPrice)}</span>
                                            </div>
                                            ${(product.salesPrice && product.listPrice && product.listPrice !== product.salesPrice)
                                                ? html`<span class='rw-product-result-list-price'>${formatPrice(product.listPrice)}</span>`
                                                : nothing
                                            }
                                        </div>
                                        </div>`,
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
            box-sizing: border-box;
            width: 100%;
            height: 2rem;
            border: .2rem solid #B3B3B3;
            padding: .75rem;
            border-radius: 1rem;
            outline: none;
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

        .rw-product-image-container {
            height: 7rem;
            width: 7rem;
        }

        .rw-product-result-tile {
            display: flex;
            margin: 1rem
        }

        .rw-product-result-display-name {
            margin: auto 1rem;
        }

        .rw-product-result-price {
            margin: auto 0 auto auto;
            position: relative
        }

        .rw-product-result-sales-price {
            display: flex;
            font-weight: 700;
            font-size: 1.25rem;
        }

        .rw-product-result-list-price {
            font-size: 1rem;
            text-decoration: line-through;
            color: darkgray;
        }
    `;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-autocomplete': Autocomplete;
    }
}