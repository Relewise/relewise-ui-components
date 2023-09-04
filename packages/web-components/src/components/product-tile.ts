import { ProductResult } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import formatPrice from '../helpers/formatPrice';
import { getRelewiseUIOptions } from '../initialize';

@customElement('relewise-product-tile')
export class ProductTile extends LitElement {

    @property({ type: Object })
    product: ProductResult | null = null;

    connectedCallback(): void {
        super.connectedCallback();
    }

    render() {
        if (!this.product) {
            return;
        }
        const settings = getRelewiseUIOptions(); 
        if (settings.templates?.product) {
            return settings.templates.product(this.product, { html, helpers: { formatPrice } });
        }

        if (this.product.data && 'Url' in this.product.data) {
            return html`
                <a class='rw-tile' href=${this.product.data['Url'].value ?? ''}>
                    ${this.renderTileContent(this.product)}
                </a>`;
        }

        return html`
            <div class='rw-tile'>
                ${this.renderTileContent(this.product)}
            </div>`;
    }

    renderTileContent(product: ProductResult) {
        return html`
            ${(product.data && 'ImageUrl' in product.data)
                ? html`<div class="rw-image-container"><img class="rw-object-cover" src=${product.data['ImageUrl'].value} /></div>`
                : nothing
            }
            <div class='information-container'>
                <h5 class='rw-display-name'>${product.displayName}</h5>
                <div class='rw-price'>
                    <span>${formatPrice(product.salesPrice)}</span>

                    ${(product.salesPrice && product.listPrice && product.listPrice !== product.salesPrice)
                        ? html`<span class='rw-list-price'>${formatPrice(product.listPrice)}</span>`
                        : nothing
                    }
                </div>
            </div>`
    }

    static styles = css`
        .rw-tile {
            display: flex;
            flex-direction: column;
            position: relative;
            text-decoration: inherit;
            text-size-adjust: none;
            height: 100%;
            font-family: Arial, Helvetica, sans-serif;
        }

        .rw-image-container {
            display: flex;
            position: relative;
        }

        .rw-information-container {
            margin-top: 0.5rem;
        }

        .rw-object-cover {
            max-width: 100%;
            height: auto;
            object-fit: cover;
        }

        .rw-price {
            margin-top: 0.5rem;
            color: var(--relewise-price-color, #212427);
            line-height: 1;
            font-weight: 600;
            font-size: var(--relewise-price-font-size, 1rem);
            align-items: center;
            display: flex;
        }

        .rw-display-name {
            color: var(--relewise-display-name-color, #212427);
            letter-spacing: -0.025rem;
            line-height: 1.25;
            font-weight: 600;
            font-size: var(--relewise-display-name-font-size, 0.75rem);
            margin-top: 0rem;
            margin-bottom: 0rem;
        }

        .rw-list-price {
            font-size: .5rem;
            text-decoration: var(--relewise-list-price-text-decoration, line-through);
            color: var(--relewise-list-price-color, darkgray);
            margin: .25rem;
        }
    `;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-tile': ProductTile;
    }
}