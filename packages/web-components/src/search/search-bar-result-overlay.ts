import { ProductResult, SearchTermPredictionResult } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('relewise-product-search-bar-result-overlay')
export class ProductSearchBarResultOverlay extends LitElement {

    @property()
    setSearchTerm = (term: string) => {};

    @property({ type: Array })
    products: ProductResult[] | null = null;

    @property({ type: Array })
    searchTermPredictions: SearchTermPredictionResult[] | null = null;

    @property({ type: Boolean })
    searchBarInFocus: boolean = false;

    @state()
    resultBoxIsHovered: boolean = false;

    connectedCallback(): void {
        super.connectedCallback();
    }

    render() {
        if (!this.searchBarInFocus && !this.resultBoxIsHovered) { 
            return;
        }

        return html`
            <div class="rw-result-container" @mouseover=${() => this.resultBoxIsHovered = true} @mouseleave=${() => this.resultBoxIsHovered = false}>
                ${(!this.searchTermPredictions ||
                this.searchTermPredictions.length < 1) &&
                (!this.products ||
                this.products.length < 1) ? html`
                    <h3>No search results to show</h3>
                ` : html`
                <div class="rw-result-grid">
                    ${this.searchTermPredictions && this.searchTermPredictions.length > 0 ? html`
                    <div class="rw-term-prediction-container">
                            ${this.searchTermPredictions.map(term =>
                                html`
                                <div>
                                    <h3 class="rw-prediction-item" @click=${() => this.setSearchTerm(term.term ?? '')}>
                                        ${term.term}
                                    </h3>
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
                </div>`}
            </div>
        `;
    }

    static styles = css`
        .rw-result-container {
            padding: 1rem;
            position: absolute;
            z-index: 99;
            background-color: white;
            box-shadow: 0 10px 15px rgb(0 0 0 / 0.2);
            overflow-y: auto;
            margin-right: 2rem;
            margin-left: 2rem;
        }

        .rw-result-grid {
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

        .rw-prediction-item {
            cursor: pointer;
        }
        
        .vl {
            border-left: 2px solid lightgray;
        }
    `;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-search-bar-result-overlay': ProductSearchBarResultOverlay;
    }
}