import { ProductResult } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import formatPrice from '../helpers/formatPrice';
import { getRelewiseUIOptions } from '../helpers/relewiseUIOptions';

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
            </div>`;
    }

    static styles = css`
        .rw-tile {
            display: flex;
            flex-direction: column;
            position: relative;
            text-decoration: inherit;
            text-size-adjust: none;
            font-family: var(--relewise-font, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji");
        }

        .rw-image-container {
            display: flex;
            position: relative;
            justify-content: var(--relewise-image-align, start);
        }

        .rw-information-container {
            margin: var(--relewise-information-container-margin, 0.5rem 0.5rem 0.5rem 0.5rem);
        }

        .rw-object-cover {
            object-fit: cover;
            max-width: var(--relewise-image-width, 100%);
            height: var(--relewise-image-height, auto);
        }

        .rw-price {
            line-height: 1;
            display: flex;
            font-weight: var(--relewise-sales-price-font-weight, 600);
            font-size: var(--relewise-sales-price-font-size, 1rem);
            color: var(--relewise-sales-price-color, #212427);
            justify-content: var(--relewise-sales-price-alignment, start);
            margin: var(--relewise-sales-price-margin, 0.5rem 0rem 0rem 0rem);
        }

        .rw-display-name {
            display: flex;
            letter-spacing: var(--relewise-display-name-letter-spacing, -0.025rem);;
            justify-content: var(--relewise-display-name-alignment, start);
            color: var(--relewise-display-name-color, #212427);
            line-height: var(--relewise-display-name-line-height, 1.25rem);
            font-weight: var(--relewise-display-name-font-weight, 600);
            font-size: var(--relewise-display-name-font-size, 0.75rem);
            margin: var(--relewise-display-name-margin, 0rem 0rem 0rem 0rem);

        }

        .rw-list-price {
            font-size: var(--relewise-list-price-font-size, .5rem);
            text-decoration: var(--relewise-list-price-text-decoration, line-through);
            color: var(--relewise-list-price-color, darkgray);
            margin: var(--relewise-list-price-margin, .25rem);
        }
    `;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-tile': ProductTile;
    }
}