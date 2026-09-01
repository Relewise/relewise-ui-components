import { ContentCategoryResult } from '@relewise/client';
import { adoptStyles, css, html, nothing, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { until } from 'lit-html/directives/until.js';
import { getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { templateHelpers } from '../helpers/templateHelpers';
import { RelewiseLitElement } from '../relewise-lit-element';
import { theme } from '../theme';

export class ContentCategoryTile extends RelewiseLitElement {

    @property({ type: Object })
    contentCategory: ContentCategoryResult | null = null;

    protected createRenderRoot(): HTMLElement | DocumentFragment {
        const root = super.createRenderRoot();

        let hasCustomTemplate = false;
        try {
            hasCustomTemplate = Boolean(getRelewiseUIOptions().templates?.contentCategory);
        } catch (error) {
            console.error('Relewise: Error during initializeRelewiseUI. Keeping default styles.', error);
        }

        if (root instanceof ShadowRoot) {
            if (!hasCustomTemplate) {
                adoptStyles(root, ContentCategoryTile.defaultStyles);
            }
        } else if (!hasCustomTemplate) {
            this.registerLightDomStyles(ContentCategoryTile.defaultStyles);
        }

        return root;
    }

    render() {
        if (!this.contentCategory) {
            return nothing;
        }

        const template = getRelewiseUIOptions().templates?.contentCategory;
        if (template) {
            return this.renderCustomTemplate(template(this.contentCategory, {
                html,
                helpers: { ...templateHelpers, unsafeHTML, nothing },
            }));
        }

        this.removeAttribute('hidden');
        return this.renderDefaultTemplate(this.contentCategory);
    }

    private renderCustomTemplate(
        result: TemplateResult<1> | typeof nothing | Promise<TemplateResult<1> | typeof nothing>,
    ) {
        if (result instanceof Promise) {
            this.removeAttribute('hidden');
            return html`${until(result.then(result => {
                this.toggleAttribute('hidden', result === nothing);
                return result;
            }))}`;
        }

        this.toggleAttribute('hidden', result === nothing);
        return result;
    }

    private renderDefaultTemplate(category: ContentCategoryResult) {
        const url = category.data?.['Url']?.value ?? null;
        const content = this.renderTileContent(category);

        return url
            ? html`<a class="rw-category-tile" part="link" href=${url}>${content}</a>`
            : html`<article class="rw-category-tile" part="container">${content}</article>`;
    }

    private renderTileContent(category: ContentCategoryResult) {
        const image = category.data?.['ImageUrl']?.value ?? null;

        return html`
            ${image ? html`
                <div class="rw-image-container" part="image-container">
                    <img class="rw-object-cover" part="image" src=${image} alt="">
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
                font-family: var(--font);
            }

            .rw-category-tile {
                border-radius: max(0px, calc(var(--relewise-category-tile-border-radius, 0.5em) - 1px));
                color: inherit;
                display: flex;
                flex-direction: column;
                height: 100%;
                overflow: clip;
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
        'relewise-content-category-tile': ContentCategoryTile;
    }
}
