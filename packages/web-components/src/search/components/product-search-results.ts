import { RelewiseLitElement } from '../../relewise-lit-element';
import { ProductResult, RetailMediaResult, User } from '@relewise/client';
import { css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events, getRelewiseUISearchOptions, QueryKeys, readCurrentUrlState } from '../../helpers';
import { theme } from '../../theme';
import { getProductSearchRenderItems } from '../retailMediaRendering';
import type { RetailMediaTargetConfiguration } from '../../builders/retailMediaBuilder';

export class ProductSearchResults extends RelewiseLitElement {
    @property({ type: Array })
    products: ProductResult[] = [];

    @property({ type: Object })
    private user: User | null = null;

    @property({ attribute: false })
    private retailMedia: RetailMediaResult | null = null;

    @property({ attribute: false })
    private retailMediaTargetConfiguration: RetailMediaTargetConfiguration | null = null;

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
        const renderItems = getProductSearchRenderItems(this.products, this.retailMedia, this.retailMediaTargetConfiguration);
        if (renderItems.length > 0) {
            return html`
                ${renderItems.map(item => item.type === 'product' ? html`
                        <relewise-product-tile
                            class="rw-product-tile ${this.showDimmingOverlay ? 'rw-dimmed' : ''}"
                            .product=${item.product}
                            .user=${this.user}>
                        </relewise-product-tile>
                    ` : html`
                        <relewise-retail-media-tile
                            class="${this.showDimmingOverlay ? 'rw-dimmed' : ''}"
                            part=${item.entity.promotedProduct ? 'retail-media-product' : 'retail-media-display-ad'}
                            exportparts="product-tile: retail-media-product-tile, sponsored-label, display-ad"
                            .entity=${item.entity}
                            .user=${this.user}>
                        </relewise-retail-media-tile>
                    `)}
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
