import { LitElement, css, html } from 'lit';
import { theme } from '../../theme';
import { Events } from '../../helpers';
import { property } from 'lit/decorators.js';

export class LoadMoreProducts extends LitElement {

    @property({ attribute: 'button-text' }) 
    buttonText: string = 'Load More';

    connectedCallback(): void {
        super.connectedCallback();
    }

    render() {
        return html`
        <relewise-button class="rw-button" @click=${() => window.dispatchEvent(new CustomEvent(Events.shouldLoadMoreProducts))}>
            ${this.buttonText}
        </relewise-button>
        `;
    }

    static styles = [theme, css`
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