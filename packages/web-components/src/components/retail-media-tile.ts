import type {
    RetailMediaResultPlacementResultEntity,
    RetailMediaResultPlacementResultEntityDisplayAd,
    RetailMediaResultPlacementResultEntityProduct,
    User,
} from '@relewise/client';
import { css, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { until } from 'lit/directives/until.js';
import { getRelewiseUIOptions, getRelewiseUIRetailMediaConfiguration } from '../helpers/relewiseUIOptions';
import formatPrice from '../helpers/formatPrice';
import { templateHelpers } from '../helpers/templateHelpers';
import { RelewiseLitElement } from '../relewise-lit-element';
import { theme } from '../theme';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import type { ProductTemplateExtensions } from '../initialize';
import { getTracker } from '../tracking/tracker';

type RetailMediaTemplate = TemplateResult<1> | typeof nothing;
type RetailMediaTemplateResult = RetailMediaTemplate | Promise<RetailMediaTemplate>;

export class RetailMediaTile extends RelewiseLitElement {
    private renderedPromotedProduct: RetailMediaResultPlacementResultEntityProduct | null = null;
    private productRenderable = true;

    @property({ attribute: false })
    entity: RetailMediaResultPlacementResultEntity | null = null;

    @property({ attribute: false })
    user: User | null = null;

    render() {
        if (this.entity?.promotedProduct) {
            return this.renderPromotedProduct(this.entity.promotedProduct);
        }

        if (this.entity?.promotedDisplayAd) {
            this.removeAttribute('hidden');
            return this.renderDisplayAd(this.entity.promotedDisplayAd);
        }

        this.setAttribute('hidden', '');
        return nothing;
    }

    private renderPromotedProduct(product: RetailMediaResultPlacementResultEntityProduct) {
        if (this.renderedPromotedProduct !== product) {
            this.renderedPromotedProduct = product;
            this.productRenderable = true;
        }
        this.toggleAttribute('hidden', !this.productRenderable);

        const sponsoredLabelTemplate = getRelewiseUIRetailMediaConfiguration()?.templates?.retailMediaSponsoredLabel;
        const sponsoredLabel = sponsoredLabelTemplate
            ? sponsoredLabelTemplate(product, this.templateExtensions())
            : html`<span>Sponsored</span>`;

        return html`
            <relewise-product-tile
                class="rw-product-tile"
                part="product-tile"
                .product=${product.result}
                .user=${this.user}
                @product-tile-renderability-changed=${this.handleProductTileRenderabilityChanged}>
            </relewise-product-tile>
            ${this.renderSponsoredLabel(sponsoredLabel)}
        `;
    }

    private renderSponsoredLabel(result: RetailMediaTemplateResult) {
        if (result instanceof Promise) {
            return until(result.then(template => this.renderSponsoredLabelTemplate(template)));
        }

        return this.renderSponsoredLabelTemplate(result);
    }

    private renderSponsoredLabelTemplate(result: RetailMediaTemplate) {
        return result === nothing
            ? nothing
            : html`
                <div class="rw-sponsored-label" part="sponsored-label">
                    ${result}
                </div>
            `;
    }

    private renderDisplayAd(displayAd: RetailMediaResultPlacementResultEntityDisplayAd) {
        const displayAdTemplate = getRelewiseUIRetailMediaConfiguration()?.templates?.retailMediaDisplayAd;
        if (!displayAdTemplate) {
            this.setAttribute('hidden', '');
            return nothing;
        }

        return html`
            <div class="rw-display-ad" part="display-ad" @click=${this.trackDisplayAdClick}>
                ${displayAdTemplate(displayAd, this.templateExtensions())}
            </div>
        `;
    }

    private readonly handleProductTileRenderabilityChanged = (event: Event): void => {
        const productTile = event.currentTarget as HTMLElement;
        this.productRenderable = !productTile.hidden;
        this.toggleAttribute('hidden', !this.productRenderable);
    };

    private readonly trackDisplayAdClick = (event: MouseEvent): void => {
        const displayAd = this.entity?.promotedDisplayAd;
        const linkWasClicked = event.composedPath().some(element => element instanceof HTMLAnchorElement);
        if (!displayAd || !this.user || !linkWasClicked) {
            return;
        }

        void getTracker(getRelewiseUIOptions()).trackDisplayAdClick({
            campaignId: displayAd.campaignId,
            displayAdId: displayAd.result.displayAdId,
            user: this.user,
        }).catch(error => console.error('Relewise Web Components: Display ad click tracking failed.', error));
    };

    private templateExtensions(): ProductTemplateExtensions {
        return {
            html,
            helpers: {
                ...templateHelpers,
                formatPrice,
                nothing,
                unsafeHTML,
                user: this.user,
            },
        };
    }

    static styles = [theme, css`
        :host {
            display: block;
            min-width: 0;
            position: relative;
        }

        :host([hidden]) {
            display: none;
        }

        .rw-product-tile,
        .rw-display-ad {
            display: block;
            height: 100%;
            min-width: 0;
        }

        .rw-sponsored-label {
            background: var(--relewise-retail-media-sponsored-label-background, rgb(255 255 255 / 0.92));
            border-radius: var(--relewise-retail-media-sponsored-label-border-radius, 0.25em);
            color: var(--relewise-retail-media-sponsored-label-color, inherit);
            font-size: var(--relewise-retail-media-sponsored-label-font-size, 0.75em);
            inset-block-start: var(--relewise-retail-media-sponsored-label-inset-block-start, 0.5em);
            inset-inline-start: var(--relewise-retail-media-sponsored-label-inset-inline-start, 0.5em);
            padding: var(--relewise-retail-media-sponsored-label-padding, 0.25em 0.5em);
            position: absolute;
            z-index: 1;
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-retail-media-tile': RetailMediaTile;
    }
}
