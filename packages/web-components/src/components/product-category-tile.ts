import { ProductCategoryResult, User } from '@relewise/client';
import { adoptStyles, css, html, nothing, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { until } from 'lit-html/directives/until.js';
import { getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { templateHelpers } from '../helpers/templateHelpers';
import { RelewiseLitElement } from '../relewise-lit-element';
import { theme } from '../theme';

export class ProductCategoryTile extends RelewiseLitElement {

    @property({ type: Object })
    productCategory: ProductCategoryResult | null = null;

    @property({ type: Object })
    private user: User | null = null;

    private templateRenderGeneration = 0;

    protected createRenderRoot(): HTMLElement | DocumentFragment {
        const root = super.createRenderRoot();

        let hasCustomTemplate = false;
        try {
            hasCustomTemplate = Boolean(getRelewiseUIOptions().templates?.productCategory);
        } catch (error) {
            console.error('Relewise: Error during initializeRelewiseUI. Keeping default styles.', error);
        }

        if (root instanceof ShadowRoot) {
            if (!hasCustomTemplate) {
                adoptStyles(root, ProductCategoryTile.defaultStyles);
            }
        } else if (!hasCustomTemplate) {
            this.registerLightDomStyles(ProductCategoryTile.defaultStyles);
        }

        return root;
    }

    disconnectedCallback() {
        this.templateRenderGeneration++;
        super.disconnectedCallback();
    }

    render() {
        const generation = ++this.templateRenderGeneration;
        if (!this.productCategory) {
            return nothing;
        }

        const template = getRelewiseUIOptions().templates?.productCategory;
        if (template) {
            return this.renderCustomTemplate(template(this.productCategory, {
                html,
                helpers: { ...templateHelpers, unsafeHTML, nothing, user: this.user },
            }), generation);
        }

        this.removeAttribute('hidden');
        return this.renderDefaultTemplate(this.productCategory);
    }

    private renderCustomTemplate(
        result: TemplateResult<1> | typeof nothing | Promise<TemplateResult<1> | typeof nothing>,
        generation: number,
    ) {
        if (result instanceof Promise) {
            this.removeAttribute('hidden');
            return html`${until(result.then(result => {
                if (generation !== this.templateRenderGeneration || !this.isConnected) {
                    return nothing;
                }

                this.toggleAttribute('hidden', result === nothing);
                return result;
            }))}`;
        }

        this.toggleAttribute('hidden', result === nothing);
        return result;
    }

    private renderDefaultTemplate(category: ProductCategoryResult) {
        const url = category.data?.['Url']?.value ?? null;
        const content = this.renderTileContent(category);

        return url
            ? html`<a class="rw-category-tile" part="link" href=${url}>${content}</a>`
            : html`<article class="rw-category-tile" part="container">${content}</article>`;
    }

    private renderTileContent(category: ProductCategoryResult) {
        const image = category.data?.['ImageUrl']?.value ?? null;

        return html`
            ${image ? html`
                <div class="rw-image-container" part="image-container">
                    <img class="rw-object-cover" part="image" src=${image} alt=${category.displayName ?? ''}>
                </div>
            ` : nothing}
            <div class="rw-information-container" part="information">
                <h5 class="rw-display-name" part="display-name">${category.displayName}</h5>
            </div>
        `;
    }

    static defaultStyles = [
        theme,
        css`
            :host {
                background-color: var(--relewise-category-tile-background-color, white);
                border: 1px solid var(--relewise-category-tile-border-color, #eee);
                border-radius: var(--relewise-category-tile-border-radius, 0.5em);
                box-shadow: var(--relewise-category-tile-box-shadow, 0 1px rgb(0 0 0 / 0.05));
                clip-path: inset(0 round var(--relewise-category-tile-border-radius, 0.5em));
                font-family: var(--font);
            }

            .rw-category-tile {
                color: inherit;
                display: flex;
                flex-direction: column;
                height: 100%;
                text-decoration: inherit;
            }

            .rw-category-tile:focus-visible {
                outline: 2px solid var(--relewise-focus-outline-color, #000);
                outline-offset: 2px;
            }

            .rw-image-container {
                background-color: var(--relewise-image-background-color, #fff);
                display: flex;
                justify-content: var(--relewise-image-align, center);
                padding: var(--relewise-image-padding, 0);
            }

            .rw-information-container {
                margin: var(--relewise-information-container-margin, 0.5em 0.5em);
            }

            .rw-object-cover {
                height: var(--relewise-image-height, auto);
                max-width: var(--relewise-image-width, 100%);
                object-fit: contain;
            }

            .rw-display-name {
                color: var(--relewise-display-name-color, #212427);
                display: -webkit-box;
                font-size: var(--relewise-display-name-font-size, 1em);
                font-weight: var(--relewise-display-name-font-weight, 500);
                height: calc(var(--relewise-display-name-line-height, 1.05em) * 2);
                text-align: var(--relewise-display-name-alignment, start);
                letter-spacing: var(--relewise-display-name-letter-spacing, -0.025em);
                line-height: var(--relewise-display-name-line-height, 1);
                margin: var(--relewise-display-name-margin, 0);
                overflow: hidden;
                -webkit-box-orient: vertical;
                -webkit-line-clamp: 2;
            }
        `,
    ];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-category-tile': ProductCategoryTile;
    }
}
