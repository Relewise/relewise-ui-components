import { ProductCategoryResult, User } from '@relewise/client';
import { adoptStyles, html, nothing, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { until } from 'lit-html/directives/until.js';
import { getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { templateHelpers } from '../helpers/templateHelpers';
import { RelewiseLitElement } from '../relewise-lit-element';
import { categoryTileStyles } from './category-tile-styles';

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
            console.error('Relewise: Error initializing initializeRelewiseUI. Keeping default styles, ', error);
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
                if (generation !== this.templateRenderGeneration) {
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

    static defaultStyles = categoryTileStyles;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-category-tile': ProductCategoryTile;
    }
}
