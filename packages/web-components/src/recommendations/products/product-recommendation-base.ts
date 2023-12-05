import { ProductRecommendationRequest, ProductRecommendationResponse, ProductResult } from '@relewise/client';
import { LitElement, css, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events } from '../../helpers/events';
import { consume } from '@lit/context';
import { BatchingContextValue, context } from '../product-recommendation-batcher';

export abstract class ProductRecommendationBase extends LitElement {

    @consume({ context, subscribe: true })
    @state()
    providedData?: BatchingContextValue;

    abstract fetchProducts(): Promise<ProductRecommendationResponse | undefined> | undefined;
    abstract buildRequest(): ProductRecommendationRequest | undefined;

    @property({ type: Number, attribute: 'number-of-recommendations' })
    numberOfRecommendations: number = 4;

    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string = undefined;

    @state()
    products: ProductResult[] | null = null;

    fetchAndUpdateProductsBound = this.fetchAndUpdateProducts.bind(this);

    constructor() {
        super();
        setTimeout(() => {
            const request = this.buildRequest();
            if (request) {
                this.dispatchEvent(new CustomEvent(Events.registerProductRecommendation, { bubbles: true, composed: true, detail: request }));
            }
        }, 0);
    }

    async connectedCallback() {
        super.connectedCallback();
        if (!this.displayedAtLocation) {
            console.error('No displayedAtLocation defined!');
        }

        await this.fetchAndUpdateProducts();
        window.addEventListener(Events.contextSettingsUpdated, this.fetchAndUpdateProductsBound);
    }

    disconnectedCallback() {
        window.removeEventListener(Events.contextSettingsUpdated, this.fetchAndUpdateProductsBound);

        super.disconnectedCallback();
    }

    async fetchAndUpdateProducts() {
        if (this.providedData?.requests) return;

        const result = await this.fetchProducts();
        this.products = result?.recommendations ?? null;
    };

    render() {
        const products = this.providedData?.requests.filter(x => x.id === this)[0];

        if (this.products || products?.result?.recommendations) {
            return html`${(products?.result?.recommendations ?? this.products ?? []).map(product =>
                html`<relewise-product-tile .product=${product}></relewise-product-tile>`)
                }`;
        }
    }

    static styles = css`
        :host {
            display: grid;
            grid-template-columns: repeat(4,1fr);
            gap: 1rem;
            grid-auto-rows: 1fr;
        }

        @media (max-width: 768px) {
            :host {
                grid-template-columns: repeat(2,1fr);
            }
        }    
    `;

}