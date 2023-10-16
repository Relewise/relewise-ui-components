import { ProductSearchResponse } from '@relewise/client';
import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { theme } from '../../theme';

export class ProductSearchResults extends LitElement {

    @property({ type: Object, attribute: 'search-result' })
    searchResult: ProductSearchResponse | null = null;

    connectedCallback(): void {
        super.connectedCallback();
    }

    render() {
        if (this.searchResult && this.searchResult.results) {
            return html`${this.searchResult.results.map(product =>
                html`<relewise-product-tile class="test" .product=${product}></relewise-product-tile>`)
            }`;
        }
    }

    static styles = [theme, css`
    :host {
        font-family: var(--font);
        display: grid;
        grid-template-columns: repeat(2,1fr);
        gap: 1rem;
        grid-auto-rows: 1fr;
    }

    .test {
        align-items: center;
    }
    
    @media (min-width: 1024px) {
        :host {
            grid-template-columns: repeat(4,1fr);
        }
    }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-search-results': ProductSearchResults;
    }
}