import { RelewiseLitElement } from '../relewise-lit-element';
import { html } from 'lit';
import { getRecommender } from './recommender';
import { getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { ProductRecommendationRequest, ProductRecommendationResponse, ProductsRecommendationCollectionBuilder } from '@relewise/client';
import { provide, createContext } from '@lit/context';
import { Events } from '../helpers';
import { RecommendationBatchingContextValue } from './recommendation-batching';

const contextKey = Symbol('product-batcher');

export type BatchingContextValue = RecommendationBatchingContextValue<ProductRecommendationRequest, ProductRecommendationResponse>;
export const context = createContext<BatchingContextValue>(contextKey);

export class RecommendationBatcher extends RelewiseLitElement {

    @provide({ context })
    data: BatchingContextValue = { requests: [] };

    timeoutHandler: ReturnType<typeof setTimeout> | undefined;

    batchBound = this.batch.bind(this);
    registerEventBound = this.registerEvent.bind(this);

    constructor() {
        super();

        this.attachShadow({ mode: 'open' });
    }

    async connectedCallback() {
        super.connectedCallback();

        window.addEventListener(Events.contextSettingsUpdated, this.batchBound);
        this.shadowRoot?.addEventListener(Events.registerProductRecommendation, this.registerEventBound);
    }

    disconnectedCallback() {
        window.removeEventListener(Events.contextSettingsUpdated, this.batchBound);
        this.shadowRoot?.removeEventListener(Events.registerProductRecommendation, this.registerEventBound);
        
        super.disconnectedCallback();
    }

    async batch() {
        if (this.data.requests.length === 0) {
            // No recommendation components found to batch
            return;
        }

        const builder = new ProductsRecommendationCollectionBuilder()
            .requireDistinctProductsAcrossResults();

        this.data.requests.forEach(x => builder.addRequest(x.request));

        const recommender = getRecommender(getRelewiseUIOptions());
        const response = await recommender.batchProductRecommendations(builder.build());
        if (!response || !response.responses || response.responses.length === 0) {
            return;
        }

        const newState: BatchingContextValue = { requests: this.data.requests };
        newState.requests.forEach((x, index) => {
            if (response.responses) {
                x.result = response.responses[index];
            }
        });
        this.data = newState;
    }

    registerEvent(e: Event) {
        e.preventDefault();

        const event = e as CustomEvent<ProductRecommendationRequest>;
        const requests = this.data.requests.filter(request => request.id !== event.target);
        requests.push({ request: event.detail, id: event.target });

        this.data = { ...this.data, requests };

        if (this.timeoutHandler) {
            clearTimeout(this.timeoutHandler);
        }

        this.timeoutHandler = setTimeout(() => this.batch(), 100);
    }

    render() {
        return html`<slot></slot>`;
    }
}