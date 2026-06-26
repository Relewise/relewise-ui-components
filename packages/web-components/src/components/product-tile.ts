import { ProductResult, User } from '@relewise/client';
import { LitElement, adoptStyles, css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import formatPrice from '../helpers/formatPrice';
import { getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { templateHelpers } from '../helpers/templateHelpers';
import { theme } from '../theme';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { until } from 'lit-html/directives/until.js';

export class ProductTile extends LitElement {

    @property({ type: Object })
    product: ProductResult | null = null;

    @property({ type: Object })
    private user: User | null = null;

    @property({ attribute: 'image-data-key' })
    imageDataKey: string = 'ImageUrl';

    @property({ attribute: 'image-base-url' })
    imageBaseUrl: string | null = null;

    @property({ attribute: 'url-data-key' })
    urlDataKey: string = 'Url';

    @property({ attribute: 'display-name-data-key' })
    displayNameDataKey: string | null = null;

    @property({ attribute: 'description-data-key' })
    descriptionDataKey: string | null = null;

    @property({ attribute: 'sales-price-data-key' })
    salesPriceDataKey: string | null = null;

    @property({ attribute: 'list-price-data-key' })
    listPriceDataKey: string | null = null;

    // Override Lit's shadow root creation and only attach default styles when no template override exists.
    protected createRenderRoot(): HTMLElement | DocumentFragment {
        const root = super.createRenderRoot();

        if (root instanceof ShadowRoot) {
            let hasCustomTemplate = false;
            try {
                const settings = getRelewiseUIOptions();
                hasCustomTemplate = Boolean(settings.templates?.product);
            } catch (error) {
                console.error('Relewise: Error initializing initializeRelewiseUI. Keeping default styles, ', error);
            }

            if (!hasCustomTemplate) {
                adoptStyles(root, ProductTile.defaultStyles);
            }
        }

        return root;
    }


    connectedCallback() {
        super.connectedCallback();
    }

    render() {
        if (!this.product) {
            return;
        }

        const settings = getRelewiseUIOptions();
        if (settings.templates?.product) {
            const result = settings.templates.product(this.product, { html, helpers: { ...templateHelpers, formatPrice, unsafeHTML, nothing, user: this.user } });
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

        const url = this.getProductDataValue(this.product, this.urlDataKey) ?? null;

        const engagementSettings = settings.userEngagement?.product;

        return html`
            <div class='rw-tile'>
                ${engagementSettings?.favorite
                ? html`<relewise-product-favorite-button
                        .product=${this.product}
                        .user=${this.user}>
                    </relewise-product-favorite-button>`
                : nothing}
                ${url
                ? html`<a class='rw-tile-link' href=${url}>${this.renderTileContent(this.product)}</a>`
                : html`<div class='rw-tile-link'>${this.renderTileContent(this.product)}</div>`}
                ${engagementSettings?.sentiment
                ? html`<relewise-product-sentiment-buttons
                            .product=${this.product}
                            .user=${this.user}>
                        </relewise-product-sentiment-buttons>`
                : nothing}
            </div>`;
    }

    renderTileContent(product: ProductResult) {
        const image = this.resolveImageUrl(this.getProductDataValue(product, this.imageDataKey));
        const displayName = this.getProductDataValue(product, this.displayNameDataKey) ?? product.displayName;
        const description = this.getProductDataValue(product, this.descriptionDataKey);
        const salesPrice = this.getProductDataValue(product, this.salesPriceDataKey) ?? product.salesPrice;
        const listPrice = this.getProductDataValue(product, this.listPriceDataKey) ?? product.listPrice;
        return html`
            ${image
                ? html`<div class="rw-image-container"><img class="rw-object-cover" src=${image} alt=${this.getProductImageAlt(product)} /></div>`
                : nothing
            }
            <div class='rw-information-container'>
                <h5 class='rw-display-name'>${displayName}</h5>
                ${description ? html`<p class="rw-description">${description}</p>` : nothing}
                <div class='rw-price'>
                    <span>${formatPrice(salesPrice)}</span>

                    ${(salesPrice && listPrice && listPrice !== salesPrice)
                ? html`<span class='rw-list-price'>${formatPrice(listPrice)}</span>`
                : nothing
            }
                </div>
            </div>`;
    }

    private getProductImageAlt(product: ProductResult): string {
        const altText = product.variant?.displayName ?? product.displayName ?? '';

        return altText ?? '';
    }

    private getProductDataValue(product: ProductResult, key: string | null) {
        if (!key || !product.data || !(key in product.data)) {
            return null;
        }

        return product.data[key].value ?? null;
    }

    private resolveImageUrl(image: unknown): unknown {
        if (!image || !this.imageBaseUrl || typeof image !== 'string' || /^https?:\/\//.test(image) || image.startsWith('//')) {
            return image;
        }

        return `${this.imageBaseUrl.replace(/\/$/, '')}/${image.replace(/^\//, '')}`;
    }

    static defaultStyles = [
        theme,
        css`
        :host {
            font-family: var(--font);
            border: 1px solid var(--relewise-checklist-facet-border-color, #eee);
            background-color: var(--button-color, white);
            clip-path: inset(0 round 0.5em);
            border-radius: 0.5em;
            box-shadow: 0 1px rgb(0 0 0 / 0.05);
        }
        
        .rw-tile {
            display: flex;
            flex-direction: column;
            position: relative;
            text-decoration: inherit;
            text-size-adjust: none;
            height: 100%;
            gap: var(--relewise-sentiment-gap, 0.5em);
        }

        .rw-tile-link {
            display: flex;
            flex-direction: column;
            text-decoration: inherit;
            color: inherit;
            flex: 1;
        }

        .rw-tile-link:focus-visible {
            outline: 2px solid var(--relewise-focus-outline-color, #000);
            outline-offset: 2px;
        }

        .rw-image-container {
            display: flex;
            padding: var(--relewise-image-padding, 0);
            background-color: var(--relewise-image-background-color, #fff);
            justify-content: var(--relewise-image-align, center);
        }

        .rw-information-container {
            margin: var(--relewise-information-container-margin, 0.5em 0.5em);
        }

        .rw-object-cover {
            object-fit: contain;
            max-width: var(--relewise-image-width, 100%);
            height: var(--relewise-image-height, auto);
        }

        .rw-price {
            line-height: 1;
            display: flex;
            font-weight: var(--relewise-sales-price-font-weight, 300);
            font-size: var(--relewise-sales-price-font-size, 1em);
            color: var(--relewise-sales-price-color, #212427);
            justify-content: var(--relewise-sales-price-alignment, start);
            align-items:center;
            margin: var(--relewise-sales-price-margin, 1em 0em 0em 0em);
        }

        .rw-display-name {
            display: -webkit-box;
            letter-spacing: var(--relewise-display-name-letter-spacing, -0.025em);
            justify-content: var(--relewise-display-name-alignment, start);
            color: var(--relewise-display-name-color, #212427);
            line-height: var(--relewise-display-name-line-height, 1);
            font-weight: var(--relewise-display-name-font-weight, 500);
            font-size: var(--relewise-display-name-font-size, 1em);
            margin: var(--relewise-display-name-margin, 0em 0em 0em 0em);
            overflow: hidden;
            height: calc(var(--relewise-display-name-line-height, 1.05em)* 2);
            
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;

        }

        .rw-list-price {
            font-size: var(--relewise-list-price-font-size, 1em);
            text-decoration: var(--relewise-list-price-text-decoration, line-through);
            font-weight: 400;
            color: var(--relewise-list-price-color, #bbb);
            margin: var(--relewise-list-price-margin, 0em 0em 0em 0.5em);
        }

        .rw-description {
            color: var(--relewise-description-color, #666);
            font-size: var(--relewise-description-font-size, 0.9em);
            line-height: var(--relewise-description-line-height, 1.2);
            margin: var(--relewise-description-margin, 0.5em 0em 0em 0em);
        }

    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-tile': ProductTile;
    }
}
