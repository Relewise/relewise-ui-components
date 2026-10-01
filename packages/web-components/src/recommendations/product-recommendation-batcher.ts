import { RelewiseLitElement } from '../relewise-lit-element';
import { html, nothing } from 'lit';
import { getRecommender } from './recommender';
import { getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { ProductRecommendationRequest, ProductRecommendationResponse, ProductsRecommendationCollectionBuilder } from '@relewise/client';
import { provide, createContext } from '@lit/context';
import { Events } from '../helpers';

const contextKey = Symbol('product-batcher');

export type BatchingContextValue = {
    enabled?: boolean;
    requests: Array<{
        request: ProductRecommendationRequest;
        id: EventTarget | null;
        result?: ProductRecommendationResponse | null;
    }>;
};
export const context = createContext<BatchingContextValue>(contextKey);

export class RecommendationBatcher extends RelewiseLitElement {

    @provide({ context })
    data: BatchingContextValue = { requests: [] };

    timeoutHandler: ReturnType<typeof setTimeout> | undefined;

    registerEventBound = this.registerEvent.bind(this);
    private abortController = new AbortController();
    private requestGeneration = 0;

    async connectedCallback() {
        super.connectedCallback();

        this.renderRoot.addEventListener(Events.registerProductRecommendation, this.registerEventBound);
    }

    disconnectedCallback() {
        this.requestGeneration++;
        this.abortController.abort();
        if (this.timeoutHandler) {
            clearTimeout(this.timeoutHandler);
        }
        this.renderRoot.removeEventListener(Events.registerProductRecommendation, this.registerEventBound);

        super.disconnectedCallback();
    }

    async batch() {
        const generation = ++this.requestGeneration;
        this.abortController.abort();
        const requests = [...this.data.requests];
        if (requests.length === 0) {
            // No recommendation components found to batch
            return;
        }

        const abortController = new AbortController();
        this.abortController = abortController;

        const builder = new ProductsRecommendationCollectionBuilder()
            .requireDistinctProductsAcrossResults();

        requests.forEach(x => builder.addRequest(x.request));

        const recommender = getRecommender(getRelewiseUIOptions());
        try {
            const response = await recommender.batchProductRecommendations(builder.build(), { abortSignal: abortController.signal });
            if (abortController.signal.aborted || generation !== this.requestGeneration || !this.isConnected) {
                return;
            }
            if (!response?.responses?.length) {
                return;
            }

            this.data = {
                requests: requests.map((request, index) => ({
                    ...request,
                    result: response.responses?.[index],
                })),
            };
        } catch (error) {
            if (!abortController.signal.aborted) {
                throw error;
            }
        }
    }

    registerEvent(e: Event) {
        e.preventDefault();

        this.requestGeneration++;
        this.abortController.abort();

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
        return this.renderRoot === this ? nothing : html`<slot></slot>`;
    }
}
