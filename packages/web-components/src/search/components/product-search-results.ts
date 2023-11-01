import { ProductResult } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { theme } from '../../theme';
import { Events } from '../../helpers';

export class ProductSearchResults extends LitElement {

    @property({ type: Array })
    products: ProductResult[] = [];

    @state()
    showLoadingSpinner: boolean = true;

    @state()
    showDimmingOverlay: boolean = false;

    connectedCallback(): void {
        super.connectedCallback();

        window.addEventListener(Events.showLoadingSpinner, () => this.handleShowLoadingSpinnerEvent());
        window.addEventListener(Events.dimPreviousResult, () => this.handleDimPreviousResultEvent());
        window.addEventListener(Events.searchingForProductsCompleted, () => this.handleSearchingForProductsCompletedEvent());
    }

    disconnectedCallback(): void {
        window.removeEventListener(Events.showLoadingSpinner, this.handleShowLoadingSpinnerEvent);
        window.removeEventListener(Events.dimPreviousResult, this.handleDimPreviousResultEvent);
        window.removeEventListener(Events.searchingForProductsCompleted, this.handleSearchingForProductsCompletedEvent);

        super.disconnectedCallback();
    }

    handleShowLoadingSpinnerEvent() {
        this.showLoadingSpinner = true;

    }

    handleDimPreviousResultEvent() {
        this.showDimmingOverlay = true;
    }

    handleSearchingForProductsCompletedEvent() {
        this.showLoadingSpinner = false;
        this.showDimmingOverlay = false;
    }

    render() {
        return html`
            <div class="rw-result-container">
                ${this.showDimmingOverlay ? html`<div class="rw-blurring-overlay"></div>`: nothing}
                ${this.products.length > 0 ? html`
                    <div class="rw-product-grid">
                        ${this.products.map(product => {
                            return html`<relewise-product-tile class="rw-product-tile" .product=${product}></relewise-product-tile>`;
                        })
                        }
                </div>
                ` : nothing}
                ${this.showLoadingSpinner ? html`
                    <div class="rw-loading-spinner-container"><relewise-loading-spinner></relewise-loading-spinner></div>
                ` : nothing}
            </div>
        `;
    }

    static styles = [theme, css`
    :host {
        font-family: var(--font);
    }

    .rw-result-container {
        position: relative;
        padding: 1rem;
    }

    .rw-loading-spinner-container {
        display: flex;
        justify-content: center;
        margin: 1rem;
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