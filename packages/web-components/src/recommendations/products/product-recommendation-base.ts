import { ProductRecommendationRequest, ProductRecommendationResponse, ProductResult, User } from '@relewise/client';
import { css, html, PropertyValues } from 'lit';
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
    private batchRequestSkipped = false;

    abstract fetchProducts(): Promise<ProductRecommendationResponse | undefined> | undefined;
    abstract buildRequest(): Promise<ProductRecommendationRequest | undefined>;

    fetchAndUpdateProductsBound = this.fetchAndUpdateProducts.bind(this);

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

    async fetchAndUpdateProducts() {
        const generation = ++this.requestGeneration;
        this.loading = true;
        this.reportCurrentRecommendationState();

        try {
            const user = await getRelewiseUIOptions().contextSettings.getUser();

            if (generation !== this.requestGeneration || !this.isConnected) {
                return;
            }

            this.user = user;
            if (this.providedData !== undefined) {
                const request = await this.buildRequest();
                if (generation !== this.requestGeneration || !this.isConnected) {
                    return;
                }

                this.batchRequestSkipped = !request;
                if (request) {
                    this.dispatchEvent(new CustomEvent(Events.registerProductRecommendation, {
                        bubbles: true,
                        composed: true,
                        detail: request,
                    }));
                }
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
            if (generation === this.requestGeneration && this.isConnected) {
                this.loading = false;
                this.reportCurrentRecommendationState();
            }
        }
    };

    protected updated(changedProperties: PropertyValues<this>): void {
        super.updated(changedProperties);
        if (changedProperties.has('providedData') || changedProperties.has('products')) {
            this.reportCurrentRecommendationState();
        }
    }

    private reportCurrentRecommendationState(): void {
        const batchedRequest = this.providedData?.requests.find(request => request.id === this);
        const recommendations = this.providedData !== undefined
            ? batchedRequest?.result?.recommendations
            : this.products;
        const loading = this.providedData !== undefined
            ? !this.batchRequestSkipped && batchedRequest?.result === undefined
            : this.loading;

        this.reportRecommendationState({
            loading,
            hasResults: Boolean(recommendations?.length),
        });
    }

    render() {
        const products = this.providedData?.requests.filter(x => x.id === this)[0];

        if (this.products || products?.result?.recommendations) {
            return html`${(products?.result?.recommendations ?? this.products ?? []).map(product =>
                html`<relewise-product-tile part="product-tile" .product=${product} .user=${this.user}></relewise-product-tile>`)
                }`;
        }
    }

    static styles = css`
        :host {
            display: grid;
            width: 100%;
            grid-template-columns: repeat(var(--relewise-recommendation-grid-columns, 4), minmax(0, 1fr));
            gap: var(--relewise-recommendation-grid-gap, 1em);
            grid-auto-rows: 1fr;
        }

        @media (max-width: 768px) {
            :host {
                grid-template-columns: repeat(var(--relewise-recommendation-grid-mobile-columns, 2), minmax(0, 1fr));
            }
        }    
    `;

}
