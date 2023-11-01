import { LitElement, css, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events, getRelewiseUISearchOptions } from '../../helpers';
import { theme } from '../../theme';

export class LoadMoreProducts extends LitElement {


    @property({ type: Number })
    hits: number | null = null;

    @property({ type: Number, attribute: 'products-loaded'})
    productsLoaded: number | null = null;

    @state()
    loading: boolean = false;

    connectedCallback(): void {
        super.connectedCallback();

        window.addEventListener(Events.showLoadingSpinner, () => this.handleShowLoadingSpinnerEvent());
        window.addEventListener(Events.searchingForProductsCompleted, () => this.handleSearchingForProductsCompletedEvent());
    }

    disconnectedCallback(): void {
        window.removeEventListener(Events.showLoadingSpinner, this.handleShowLoadingSpinnerEvent);
        window.removeEventListener(Events.searchingForProductsCompleted, this.handleSearchingForProductsCompletedEvent);

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