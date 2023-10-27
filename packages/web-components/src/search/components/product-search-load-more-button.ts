import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { Events, getRelewiseUISearchOptions } from '../../helpers';
import { theme } from '../../theme';

export class LoadMoreProducts extends LitElement {


    @property({ type: Number })
    hits: number | null = null;

    @property({ type: Number, attribute: 'products-loaded'})
    productsLoaded: number | null = null;

    connectedCallback(): void {
        super.connectedCallback();
    }

    render() {
        if (!this.productsLoaded || !this.hits || this.productsLoaded === this.hits) {
            return;
        }
        const localization = getRelewiseUISearchOptions().localization?.loadMoreButton;
        return html`
            <relewise-button class="rw-button" @click=${() => window.dispatchEvent(new CustomEvent(Events.loadMoreProducts))}>
                ${localization?.button ?? 'Load More'}
            </relewise-button>
        `;
    }

    static styles = [theme, css`
        :host {
            margin: 1rem;
        }

        .rw-button {
            height: 3.25rem;
            border: 2px solid;
            border-color: var(--accent-color);
            border-radius: 1rem;
            background-color: var(--accent-color);
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-search-load-more-button': LoadMoreProducts;
    }
}