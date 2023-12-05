import { LitElement, html } from 'lit';
import { getRecommender } from './recommender';
import { getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { ProductRecommendationRequest, ProductRecommendationResponse, ProductsRecommendationCollectionBuilder } from '@relewise/client';
import { provide, createContext } from '@lit/context';
import { Events } from '../helpers';

const contextKey = Symbol('product-batcher');

export type BatchingContextValue = {
    requests: { request: ProductRecommendationRequest, id: EventTarget | null, result?: ProductRecommendationResponse | null }[]
}
export const context = createContext<BatchingContextValue>(contextKey);

export class RecommendationBatcher extends LitElement {

    @provide({ context })
    data: BatchingContextValue = { requests: [] };

    timeoutHandler: ReturnType<typeof setTimeout> | undefined;

    constructor() {
        super();

        this.attachShadow({ mode: 'open' });

        this.shadowRoot?.addEventListener(Events.registerProductRecommendation, (e) => {
            e.preventDefault();

            const newState: BatchingContextValue = { requests: this.data.requests };
            newState.requests.push({ request: (e as CustomEvent).detail, id: (e as CustomEvent).target });
            this.data = newState;

            if (this.timeoutHandler) { clearTimeout(this.timeoutHandler); }
            this.timeoutHandler = setTimeout(() => this.batch(), 100);
        });
    }

    async batch() {
        if (this.data.requests.length === 0) {
            // No recommendation components found to batch
            return;
        }

        const builder = new ProductsRecommendationCollectionBuilder();

        this.data.requests.forEach(x => builder.addRequest(x.request));

        const recommender = getRecommender(getRelewiseUIOptions());
        const response = await recommender.batchProductRecommendations(builder.build());
        if (!response || !response.responses || response.responses.length === 0) {
            return;
        }

        const newState: BatchingContextValue = { requests: this.data.requests };
        newState.requests.forEach((x, index) => x.result = response.responses[index]);
        this.data = newState;


    }

    render() {
        return html`<slot></slot>`;
    }
}