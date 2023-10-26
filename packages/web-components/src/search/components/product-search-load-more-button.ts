import { LitElement, css, html } from 'lit';
import { theme } from '../../theme';
import { Events } from '../../helpers';
import { property } from 'lit/decorators.js';

export class LoadMoreProducts extends LitElement {

    @property({ attribute: 'button-text' }) 
    buttonText: string = 'Load More';

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

        return html`
            <relewise-button class="rw-button" @click=${() => window.dispatchEvent(new CustomEvent(Events.loadMoreProducts))}>
                ${this.buttonText}
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