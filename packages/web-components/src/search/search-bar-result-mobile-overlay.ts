import { ProductResult } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('relewise-product-search-bar-result-mobile-overlay')
export class ProductSearchBarResultMobileOverlay extends LitElement {
    @property({ type: Array })
    products: ProductResult[] | null = null;

    connectedCallback(): void {
        super.connectedCallback();
    }

    render() {
        return html`
            <div class="rw-result-container">
                ${this.products && this.products.length > 0 ? 
                    html`
                    <div class="rw-products-container">
                        ${this.products.map(product =>
                            html`<relewise-product-search-result-tile .product=${product}></relewise-product-search-result-tile>`,
                        )}
                    </div>
                    ` : nothing}
            </div>
        `;
    }

    static styles = css`
        .rw-result-container {
            position: fixed;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: white;
            z-index: 9999;
        }
    `;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-search-bar-result-mobile-overlay': ProductSearchBarResultMobileOverlay;
    }
}