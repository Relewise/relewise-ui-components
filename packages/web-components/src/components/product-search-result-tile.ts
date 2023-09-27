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
        console.log('test')
        if (!this.product) {
            return;
        }

        return html`
        <div class="rw-product-result-tile">
            ${(this.product.data && 'ImageUrl' in this.product.data) ? 
                html`
                <img class="rw-product-image-container" src=${this.product.data['ImageUrl'].value} />
                ` : nothing
            }
            <h4 class="rw-product-result-display-name">${this.product.displayName}</h4>
            <div class='rw-product-result-price'>
                <div>
                    <span class="rw-product-result-sales-price">${formatPrice(this.product.salesPrice)}</span>
                </div>
                ${(this.product.salesPrice && this.product.listPrice && this.product.listPrice !== this.product.salesPrice) ? 
                    html`
                    <span class='rw-product-result-list-price'>${formatPrice(this.product.listPrice)}</span>
                    ` : nothing
                }
            </div>
        </div>
        `
    }

    static styles = css`
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
        'relewise-product-search-result-tile': ProductSearchResultTile;
    }
}