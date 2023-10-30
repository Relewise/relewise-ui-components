import { ProductResult } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { theme } from '../../theme';
import { Events } from '../../helpers';

export class ProductSearchResults extends LitElement {

    @property({ type: Array })
    products: ProductResult[] = [];

    @state()
    loading: boolean = false;

    connectedCallback(): void {
        super.connectedCallback();
        window.addEventListener(Events.searchingForProducts, () => this.loading = true);
        window.addEventListener(Events.searchingForProductsCompleted, () => this.loading = false);
    }

    render() {
        return html`
            ${this.products.length > 0 ? html`
                <div class="rw-product-grid">
                    ${this.products.map(product => {
                        return html`<relewise-product-tile class="rw-product-tile" .product=${product}></relewise-product-tile>`;
                    })
                    }
               </div>
            ` : nothing}
            ${this.loading ? html`
                <div class="rw-loading-spinner-container"><relewise-loading-spinner></relewise-loading-spinner></div>
            ` : nothing}
        `;
    }

    static styles = [theme, css`
    :host {
        font-family: var(--font);
    }

    .rw-loading-spinner-container {
        display: flex;
        justify-content: center;
    }

    .rw-product-grid {
        display: grid;
        grid-template-columns: repeat(2,1fr);
        gap: 1rem;
    }

    .rw-product-tile {
        --relewise-image-height: 32rem;
        display: flex;
        align-items: center;
        justify-content: center;
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