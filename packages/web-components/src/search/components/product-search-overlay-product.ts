import { ProductResult } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { getRelewiseUISearchOptions } from '../../helpers';
import formatPrice from '../../helpers/formatPrice';
import { templateHelpers } from '../../helpers/templateHelpers';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { until } from 'lit-html/directives/until.js';
import { theme } from '../../theme';

export class ProductSearchOverlayProduct extends LitElement {

    @property({ type: Object })
    product: ProductResult | undefined | null = null;

    connectedCallback(): void {
        super.connectedCallback();
    }

    render() {
        if (!this.product) {
            return;
        }

        const settings = getRelewiseUISearchOptions();
        if (settings?.templates?.searchOverlayProductResult) {
            const result = settings.templates.searchOverlayProductResult(this.product, { html, helpers: { ...templateHelpers, formatPrice, unsafeHTML, nothing } });
            const markup = result instanceof Promise ? html`
                ${until(result.then(result => {
                if (result === nothing) {
                    this.toggleAttribute('hidden', true);
                }

                return result;
            }))}` : result;

            if (result === nothing) {
                this.toggleAttribute('hidden', true);
            }

            return html`${markup}`;
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
            ${(product.data && 'ImageUrl' in product.data) ?
                html`
                <img class="rw-product-image-container" src=${product.data['ImageUrl'].value} />
                ` : nothing
            }
            <h4 class="rw-product-result-display-name">${product.displayName}</h4>
            <div class='rw-product-result-price'>
                <span class="rw-product-result-sales-price">${formatPrice(product.salesPrice)}</span>
                ${(product.salesPrice && product.listPrice && product.listPrice !== product.salesPrice) ?
                html`
                    <span class='rw-product-result-list-price'>${formatPrice(product.listPrice)}</span>
                    ` : nothing
            }
            </div>`;
    }

    static styles = [theme, css`
        
        .rw-tile {
            text-decoration: inherit;
            text-size-adjust: inherit;
            color: inherit;
            display: flex;
            margin: 0.5em 1em;
        }

        .rw-product-image-container {
            height: var(--relewise-product-search-result-overlay-product-image-height, 3em);
            width: var(--relewise-product-search-result-overlay-product-image-width, 3em);
        }

        .rw-product-result-display-name {
            margin: auto 0.5em;
            font-weight: normal;
            overflow: var(--relewise-product-search-result-overlay-product-diplay-name-overflow, hidden);
            color: var(--relewise-product-search-result-overlay-product-diplay-name-color, #212427);
            text-overflow: var(--relewise-product-search-result-overlay-product-diplay-name-text-overflow, ellipsis);
        }

        .rw-product-result-price {
            margin: auto 0 auto auto;
            position: relative;
            text-align: right;
        }

        .rw-product-result-sales-price {
            font-weight: var(--relewise-product-search-result-overlay-product-sales-price-font-weight, 400);
            font-size: var(--relewise-product-search-result-overlay-product-sales-price-font-size, 0.9em);
            color: var(--relewise-product-search-result-overlay-product-sales-price-color, #212427);
        }

        .rw-product-result-list-price {
            font-size: var(--relewise-product-search-result-overlay-product-list-price-font-size, 0.9em);
            text-decoration: var(--relewise-product-search-result-overlay-product-list-price-text-decoration, line-through);
            color: var(--relewise-product-search-result-overlay-product-list-price-text-color, darkgray);
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-search-overlay-product': ProductSearchOverlayProduct;
    }
}