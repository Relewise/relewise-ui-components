import { ProductResult } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import formatPrice from '../helpers/formatPrice';

@customElement('relewise-product-search-result-tile')
export class ProductSearchResultTile extends LitElement {

    @property({ type: Object })
    product: ProductResult | null = null;

    connectedCallback(): void {
        super.connectedCallback();
    }

    render() {
        if (!this.product) {
            return;
        }

        if (this.product.data && 'Url' in this.product.data) {
            return html`
                <a class='rw-tile' href=${this.product.data['Url'].value ?? ''}>
                    ${this.renderTileContent(this.product)}
                </a>`;
        }
        
        return  html`
            <a class='rw-tile'>
                ${this.renderTileContent(this.product)}
            </a>`;
    }

    renderTileContent(product: ProductResult) {
        return html`
        <div class="rw-product-result-tile">
            ${(product.data && 'ImageUrl' in product.data) ? 
                html`
                <img class="rw-product-image-container" src=${product.data['ImageUrl'].value} />
                ` : nothing
            }
            <h4 class="rw-product-result-display-name">${product.displayName}</h4>
            <div class='rw-product-result-price'>
                <div>
                    <span class="rw-product-result-sales-price">${formatPrice(product.salesPrice)}</span>
                </div>
                ${(product.salesPrice && product.listPrice && product.listPrice !== product.salesPrice) ? 
                    html`
                    <span class='rw-product-result-list-price'>${formatPrice(product.listPrice)}</span>
                    ` : nothing
                }
            </div>
        </div>
        `;
    }

    static styles = css`
        .rw-tile {
            color: inherit; /* blue colors for links too */
            text-decoration: inherit; /* no underline */
            font-family: var(--relewise-font, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji");
        }

        .rw-product-image-container {
            min-height: 5rem;
            max-height: 5rem;
            min-width: 5rem;
            max-width: 5rem;
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
        'relewise-product-search-result-tile': ProductSearchResultTile;
    }
}