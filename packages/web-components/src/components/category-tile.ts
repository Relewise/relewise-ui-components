import { RelewiseLitElement } from '../relewise-lit-element';
import { ProductCategoryResult } from '@relewise/client';
import { adoptStyles, css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { theme } from '../theme';

export class CategoryTile extends RelewiseLitElement {

    @property({ type: Object })
    category: ProductCategoryResult | null = null;

    protected createRenderRoot(): HTMLElement | DocumentFragment {
        const root = super.createRenderRoot();

        if (root instanceof ShadowRoot) {
            adoptStyles(root, CategoryTile.defaultStyles);
        } else {
            this.registerLightDomStyles(CategoryTile.defaultStyles);
        }

        return root;
    }

    connectedCallback() {
        super.connectedCallback();
    }

    render() {
        if (!this.category) {
            return nothing;
        }

        const url = this.category.data?.['Url']?.value ?? null;

        if (url) {
            return html`
                <a class="rw-category-tile" part="link" href=${url}>
                    ${this.renderTileContent(this.category)}
                </a>
            `;
        }

        return html`
            <article class="rw-category-tile" part="container">
                ${this.renderTileContent(this.category)}
            </article>
        `;
    }

    renderTileContent(category: ProductCategoryResult) {
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
            font-family: var(--font);
            border: 1px solid var(--relewise-checklist-facet-border-color, #eee);
            background-color: var(--button-color, white);
            clip-path: inset(0 round 0.5em);
            border-radius: 0.5em;
            box-shadow: 0 1px rgb(0 0 0 / 0.05);
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
            height: calc(var(--relewise-display-name-line-height, 1.05em) * 2);
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-category-tile': CategoryTile;
    }
}
