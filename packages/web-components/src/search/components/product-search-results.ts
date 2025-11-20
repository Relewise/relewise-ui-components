import { ProductResult, User } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events, getRelewiseUISearchOptions, QueryKeys, readCurrentUrlState } from '../../helpers';
import { theme } from '../../theme';

export class ProductSearchResults extends LitElement {
    @property({ type: Array })
    products: ProductResult[] = [];

    @property({ type: Object })
    private user: User | null = null;

    @state()
    showLoadingSpinner: boolean = true;

    @state()
    showDimmingOverlay: boolean = false;

    handleShowLoadingSpinnerEventBound = this.handleShowLoadingSpinnerEvent.bind(this);
    handleDimPreviousResultEventBound = this.handleDimPreviousResultEvent.bind(this);
    handleSearchingForProductsCompletedEventBound = this.handleSearchingForProductsCompletedEvent.bind(this);

    connectedCallback(): void {
        super.connectedCallback();

        window.addEventListener(Events.showLoadingSpinner, this.handleShowLoadingSpinnerEventBound);
        window.addEventListener(Events.dimPreviousResult, this.handleDimPreviousResultEventBound);
        window.addEventListener(Events.searchingForProductsCompleted, this.handleSearchingForProductsCompletedEventBound);
    }

    disconnectedCallback(): void {
        window.removeEventListener(Events.showLoadingSpinner, this.handleShowLoadingSpinnerEventBound);
        window.removeEventListener(Events.dimPreviousResult, this.handleDimPreviousResultEventBound);
        window.removeEventListener(Events.searchingForProductsCompleted, this.handleSearchingForProductsCompletedEventBound);

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
        const localization = getRelewiseUISearchOptions()?.localization?.searchResults;
        if (this.products.length > 0) {
            return html`
                ${this.products.map(product => {
                return html`
                        <relewise-product-tile
                            class="rw-product-tile ${this.showDimmingOverlay ? 'rw-dimmed' : ''}"
                            .product=${product}
                            .user=${this.user}>
                        </relewise-product-tile>`;
            })}
                ${this.showLoadingSpinner ? html`
                    <div class="rw-fill-grid"><relewise-loading-spinner></relewise-loading-spinner></div>
                `: nothing}
            `;
        }

        if (this.showLoadingSpinner) {
            return html`
                <div class="rw-fill-grid"><relewise-loading-spinner></relewise-loading-spinner></div>
            `;
        }


        if (!this.showLoadingSpinner && !this.showDimmingOverlay) {
            return html`<span class="rw-fill-grid">${localization?.noResults ?? html`<strong>No results for "${readCurrentUrlState(QueryKeys.term) ?? null}".</strong>Try different keywords or fewer filters.`}</span>`;
        }
    }

    static styles = [theme, css`
        :host {
            font-family: var(--font);
            position: relative;
            display: grid;
            grid-template-columns: repeat(2,1fr);
            gap: 1em;
        }

        .rw-dimmed {
            opacity: .5;
        }

        .rw-product-tile {
            display: flex;
            align-items: center;
        }

        .rw-fill-grid {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            grid-column: 1/-1;
        }
        
        @media (min-width: 1023px) {
            :host {
                font-family: var(--font);
                position: relative;
                display: grid;
                grid-template-columns: repeat(4,1fr);
                gap: 1em;
            }

            .rw-fill-grid {
                display: flex;
                align-items: center;
                justify-content: center;
                grid-column: 1/-1;
            }
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-search-results': ProductSearchResults;
    }
}