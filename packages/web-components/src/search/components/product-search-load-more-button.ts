import { RelewiseLitElement } from '../../relewise-lit-element';
import { css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events, getRelewiseUISearchOptions } from '../../helpers';
import { theme } from '../../theme';

export class LoadMoreProducts extends RelewiseLitElement {
    @property()
    direction: 'next' | 'previous' = 'next';

    @property({ type: Number })
    hits: number | null = null;

    @property({ type: Number, attribute: 'products-loaded' })
    productsLoaded: number | null = null;

    @property({ type: Number })
    offset: number = 0;

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
        const hasMore = this.direction === 'previous'
            ? this.offset > 0
            : Boolean(this.productsLoaded && this.hits && this.offset + this.productsLoaded < this.hits);
        if (this.loading || !hasMore) {
            return;
        }
        const localization = getRelewiseUISearchOptions()?.localization?.loadMoreButton;
        const buttonLabel = this.direction === 'previous'
            ? localization?.loadPrevious ?? 'Load previous'
            : localization?.loadMore ?? 'Load More';
        return html`
            ${this.direction === 'next' ? html`
                <span class="rw-products-shown">${localization?.showing ?? 'Showing'} ${this.offset + (this.productsLoaded ?? 0)} ${localization?.outOf ?? 'out of'} ${this.hits} ${localization?.products ?? 'products'}</span>
            ` : nothing}
            <div class="rw-button-container">
                <relewise-button @click=${this.loadMore}>
                    <span class="rw-load-more-text">${buttonLabel}</span>
                </relewise-button>
            </div>
        `;
    }

    private readonly loadMore = (): void => {
        const event = this.direction === 'previous' ? Events.loadPreviousProducts : Events.loadMoreProducts;
        window.dispatchEvent(new CustomEvent(event));
    };

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
            font-size: var(--relewise-load-more-text-size, .85em);
            color: var(--relewise-load-more-text-color, black);
            padding: .5em .25rem;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .rw-products-shown {
            display: flex;
            justify-content: center;
            color: var(--relewise-products-shown-color, black);
            font-size: var(--relewise-products-shown-font-size, .85em);
            margin-top: .5em;
            margin-bottom: .5em;
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-search-load-more-button': LoadMoreProducts;
    }
}
