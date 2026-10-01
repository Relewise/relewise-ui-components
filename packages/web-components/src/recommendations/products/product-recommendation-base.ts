import { ProductRecommendationRequest, ProductRecommendationResponse, ProductResult, User } from '@relewise/client';
import { css, html, nothing } from 'lit';
import type { PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events } from '../../helpers/events';
import { consume } from '@lit/context';
import { BatchingContextValue, context } from '../product-recommendation-batcher';
import { getRelewiseUIOptions } from '../../helpers';
import { RecommendationStateElement } from '../recommendation-state';

export abstract class ProductRecommendationBase extends RecommendationStateElement {

    @property({ type: String, attribute: 'target' })
    target: string | null = null;

    @property({ type: Number, attribute: 'number-of-recommendations' })
    numberOfRecommendations: number = 4;

    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string = undefined;

    @consume({ context, subscribe: true })
    @state()
    providedData?: BatchingContextValue;

    @state()
    products: ProductResult[] | null = null;

    @state()
    private user: User | null = null;

    private requestGeneration = 0;
    private loading = false;

    abstract fetchProducts(): Promise<ProductRecommendationResponse | undefined> | undefined;
    abstract buildRequest(): Promise<ProductRecommendationRequest | undefined>;

    fetchAndUpdateProductsBound = this.fetchAndUpdateProducts.bind(this);

    private get batchEnabled(): boolean {
        return this.providedData !== undefined && this.providedData.enabled !== false;
    }

    private get batchRequest() {
        return this.providedData?.requests.find(request => request.id === this);
    }

    private get renderedProducts(): ProductResult[] | null {
        const batchRequest = this.batchRequest;
        if (this.batchEnabled && batchRequest && 'result' in batchRequest) {
            return batchRequest.result?.recommendations ?? null;
        }

        return this.products;
    }

    async connectedCallback() {
        super.connectedCallback();
        if (!this.displayedAtLocation) {
            console.error('Missing displayed-at-location attribute on recommendation component.');
        }

        window.addEventListener(Events.contextSettingsUpdated, this.fetchAndUpdateProductsBound);
        void this.fetchAndUpdateProducts();
    }

    disconnectedCallback() {
        this.requestGeneration++;
        window.removeEventListener(Events.contextSettingsUpdated, this.fetchAndUpdateProductsBound);

        super.disconnectedCallback();
    }

    protected updated(changedProperties: PropertyValues<this>): void {
        super.updated(changedProperties);
        const previousData = changedProperties.get('providedData');
        if (previousData !== undefined && previousData.enabled !== false && !this.batchEnabled) {
            void this.fetchAndUpdateProducts();
            return;
        }

        if (changedProperties.has('providedData')
            && this.batchEnabled
            && this.batchRequest
            && 'result' in this.batchRequest) {
            this.loading = false;
            this.reportCurrentRecommendationState();
        }
    }

    async fetchAndUpdateProducts() {
        const generation = ++this.requestGeneration;
        this.loading = true;
        this.reportCurrentRecommendationState();
        let waitingForBatch = false;

        try {
            const user = await getRelewiseUIOptions().contextSettings.getUser();

            if (generation !== this.requestGeneration || !this.isConnected) {
                return;
            }

            this.user = user;
            if (this.batchEnabled) {
                const request = await this.buildRequest();
                if (generation !== this.requestGeneration || !this.isConnected) {
                    return;
                }
                if (!request) {
                    this.products = null;
                    return;
                }

                waitingForBatch = true;
                this.dispatchEvent(new CustomEvent(Events.registerProductRecommendation, {
                    bubbles: true,
                    composed: true,
                    detail: request,
                }));
                return;
            }

            const result = await this.fetchProducts();

            if (generation !== this.requestGeneration || !this.isConnected) {
                return;
            }

            this.products = result?.recommendations ?? null;
        } catch {
            if (generation === this.requestGeneration && this.isConnected) {
                this.products = null;
            }
        } finally {
            if (generation === this.requestGeneration && this.isConnected && !waitingForBatch) {
                this.loading = false;
                this.reportCurrentRecommendationState();
            }
        }
    };

    private reportCurrentRecommendationState(): void {
        this.reportRecommendationState({
            loading: this.loading,
            hasResults: Boolean(this.renderedProducts?.length),
        });
    }

    private get beforeResultsElements(): HTMLElement[] {
        return Array.from(this.children)
            .filter((element): element is HTMLElement => element instanceof HTMLElement && element.slot === 'before-results');
    }

    private renderProducts() {
        return this.renderedProducts?.map(product => html`
            <relewise-product-tile
                part="product-tile"
                .product=${product}
                .user=${this.user}>
            </relewise-product-tile>`);
    }

    render() {
        const hasResults = Boolean(this.renderedProducts?.length);
        if (!hasResults) {
            return nothing;
        }

        const products = this.renderProducts();
        if (this.beforeResultsElements.length === 0) {
            return products;
        }

        const productGrid = html`
            <div
                class="rw-recommendation-grid rw-product-recommendation-grid"
                part="recommendation-grid product-recommendation-grid">
                ${products}
            </div>`;

        return html`
            <div class="rw-recommendation-layout">
                <slot name="before-results"></slot>
                ${productGrid}
            </div>`;
    }

    static styles = css`
        :host {
            display: grid;
            width: 100%;
            grid-template-columns: repeat(var(--relewise-recommendation-grid-columns, 4), minmax(0, 1fr));
            gap: var(--relewise-recommendation-grid-gap, 1em);
            grid-auto-rows: 1fr;
        }

        :host:has(> [slot="before-results"]) {
            grid-auto-rows: auto;
        }

        :host:not(:has(.rw-recommendation-grid)) > [slot="before-results"] {
            display: none;
        }

        :host > product-and-variant-id {
            display: none;
        }

        .rw-recommendation-layout,
        .rw-recommendation-grid,
        :host > [slot="before-results"] {
            grid-column: 1 / -1;
        }

        .rw-recommendation-layout {
            display: flex;
            flex-direction: column;
            gap: var(--relewise-recommendation-grid-gap, 1em);
            min-width: 0;
        }

        .rw-recommendation-grid {
            display: grid;
            width: 100%;
            grid-template-columns: repeat(var(--relewise-recommendation-grid-columns, 4), minmax(0, 1fr));
            gap: var(--relewise-recommendation-grid-gap, 1em);
            grid-auto-rows: 1fr;
        }

        @media (max-width: 768px) {
            :host,
            .rw-recommendation-grid {
                grid-template-columns: repeat(var(--relewise-recommendation-grid-mobile-columns, 2), minmax(0, 1fr));
            }
        }
    `;

}
