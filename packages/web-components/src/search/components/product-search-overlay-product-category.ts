import { ProductCategoryResult } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { getRelewiseUISearchOptions } from '../../helpers';
import formatPrice from '../../helpers/formatPrice';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { until } from 'lit-html/directives/until.js';

export class ProductSearchOverlayProductCategory extends LitElement {

    @property({ type: Object })
    productCategory: ProductCategoryResult | undefined | null = null;

    connectedCallback(): void {
        super.connectedCallback();
    }

    render() {
        if (!this.productCategory) {
            return;
        }

        const settings = getRelewiseUISearchOptions();
        if (settings?.templates?.searchOverlayProductCategoryResult) {
            const result = settings.templates.searchOverlayProductCategoryResult(this.productCategory, { html, helpers: { formatPrice, unsafeHTML, nothing } });
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

        if (this.productCategory.data && 'Url' in this.productCategory.data) {
            return html`
                <a class='rw-tile' href=${this.productCategory.data['Url'].value ?? ''}>
                    ${this.renderTileContent(this.productCategory)}
                </a>`;
        }

        return html`
            <div class='rw-tile'>
                ${this.renderTileContent(this.productCategory)}
            </div>`;
    }

    renderTileContent(productCategory: ProductCategoryResult) {
        return html`<h4 class="rw-product-category-result-display-name">${productCategory.displayName}</h4>`;
    }

    static styles = css`
        .rw-tile {
            text-decoration: inherit;
            text-size-adjust: inherit;
            color: inherit;
            display: flex;
            padding: 0.3rem 1rem;
        }

        .rw-product-category-result-display-name {
            margin: 0;
            font-size: var(--relewise-product-search-result-overlay-product-category-diplay-name-font-size, 0.9rem);
            font-weight: var(--relewise-product-search-result-overlay-product-category-diplay-name-font-weight, normal);
            overflow: var(--relewise-product-search-result-overlay-product-category-diplay-name-overflow, hidden);
            color: var(--relewise-product-search-result-overlay-product-category-diplay-name-color, #212427);
            text-overflow: var(--relewise-product-search-result-overlay-category-product-diplay-name-text-overflow, ellipsis);
        }
    `;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-search-overlay-product-category': ProductSearchOverlayProductCategory;
    }
}