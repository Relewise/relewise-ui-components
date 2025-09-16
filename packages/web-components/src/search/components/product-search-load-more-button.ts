import { LitElement, css, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events, getRelewiseUISearchOptions } from '../../helpers';
import { theme } from '../../theme';

export class LoadMoreProducts extends LitElement {
    @property({ type: Number })
    hits: number | null = null;

    @property({ type: Number, attribute: 'products-loaded' })
    productsLoaded: number | null = null;

    @state()
    loading: boolean = false;

    handleShowLoadingSpinnerEventBound = this.handleShowLoadingSpinnerEvent.bind(this);
    handleSearchingForProductsCompletedEventBound = this.handleSearchingForProductsCompletedEvent.bind(this);

    connectedCallback(): void {
        super.connectedCallback();

        window.addEventListener(Events.showLoadingSpinner, this.handleShowLoadingSpinnerEventBound);
        window.addEventListener(Events.searchingForProductsCompleted, this.handleSearchingForProductsCompletedEventBound);
    }

    disconnectedCallback(): void {
        window.removeEventListener(Events.showLoadingSpinner, this.handleShowLoadingSpinnerEventBound);
        window.removeEventListener(Events.searchingForProductsCompleted, this.handleSearchingForProductsCompletedEventBound);

        super.disconnectedCallback();
    }

    handleShowLoadingSpinnerEvent() {
        this.loading = true;
    }

    handleSearchingForProductsCompletedEvent() {
        this.loading = false;
    }

    render() {
        if (this.loading || !this.productsLoaded || !this.hits || this.productsLoaded === this.hits) {
            return;
        }
        const localization = getRelewiseUISearchOptions()?.localization?.loadMoreButton;
        return html`
            <span class="rw-products-shown">${localization?.showing ?? 'Showing'} ${this.productsLoaded} ${localization?.outOf ?? 'out of'} ${this.hits} ${localization?.products ?? 'products'}</span>
            <div class="rw-button-container">
                <relewise-button @click=${() => window.dispatchEvent(new CustomEvent(Events.loadMoreProducts))}>
                    <span class="rw-load-more-text">${localization?.loadMore ?? 'Load More'}</span>
                </relewise-button>
            </div>
        `;
    }

    static styles = [theme, css`
        :host {
            justify-content: center;
        }

        .rw-button-container {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .rw-load-more-text {
            font-family: var(--font);
            font-size: var(--relewise-load-more-text-size, .85rem);
            color: var(--relewise-load-more-text-color, black);
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .rw-products-shown {
            display: flex;
            justify-content: center;
            color: var(--relewise-products-shown-color, black);
            font-size: var(--relewise-products-shown-font-size, .75rem);
            margin-top: .5rem;
            margin-bottom: .5rem;
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-search-load-more-button': LoadMoreProducts;
    }
}