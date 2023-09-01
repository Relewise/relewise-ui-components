import { ProductResult } from '@relewise/client';
import { LitElement, css, html } from 'lit';
import { state } from 'lit/decorators.js';
import './product-tile';

export abstract class RelewiseProductRecommendationElement extends LitElement {

    abstract fetchProducts(): void;

    @state()
    products: ProductResult[] | null = null;

    connectedCallback(): void {
        super.connectedCallback();
        this.fetchProducts();
    }

    render() {
        if (this.products) {
            return html`<div class="grid">
                ${this.products.map(product =>
                    html`<relewise-product-tile .product=${product}></relewise-product-tile>`)
                }
            </div>`
        }
    }

    static styles = css`
        .grid {
            display: grid;
            grid-template-columns: var(--relewise-grid-template-columns, repeat(5,1fr));
            gap: 1rem;
            grid-auto-rows: 1fr;
        }

        @media screen and (max-width:768px) {
            .grid {
                grid-template-columns:var(--relewise-mobile-grid-template-columns, repeat(2,1fr));
            }
        }`;
}