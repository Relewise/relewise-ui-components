import { RelewiseLitElement } from '../relewise-lit-element';
import { html } from 'lit';
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

export class RecommendationBatcher extends RelewiseLitElement {

    @provide({ context })
    data: BatchingContextValue = { requests: [] };

    timeoutHandler: ReturnType<typeof setTimeout> | undefined;
    private requestGeneration = 0;

    resetRequestsBound = this.resetRequests.bind(this);
    registerEventBound = this.registerEvent.bind(this);

    async connectedCallback() {
        super.connectedCallback();

        window.addEventListener(Events.contextSettingsUpdated, this.resetRequestsBound);
        this.renderRoot.addEventListener(Events.registerProductRecommendation, this.registerEventBound);
    }

    disconnectedCallback() {
        this.requestGeneration++;
        if (this.timeoutHandler) {
            clearTimeout(this.timeoutHandler);
        }
        window.removeEventListener(Events.contextSettingsUpdated, this.resetRequestsBound);
        this.renderRoot.removeEventListener(Events.registerProductRecommendation, this.registerEventBound);
        
        super.disconnectedCallback();
    }

    async batch() {
        if (this.data.requests.length === 0) {
            // No recommendation components found to batch
            return;
        }

        const generation = ++this.requestGeneration;
        const requests = this.data.requests;
        const builder = new ProductsRecommendationCollectionBuilder();

        requests.forEach(x => builder.addRequest(x.request));

        try {
            const recommender = getRecommender(getRelewiseUIOptions());
            const response = await recommender.batchProductRecommendations(builder.build());
            if (generation !== this.requestGeneration || !this.isConnected) {
                return;
            }

            this.data = {
                requests: requests.map((request, index) => ({
                    ...request,
                    result: response?.responses?.[index] ?? null,
                })),
            };
        } catch {
            if (generation === this.requestGeneration && this.isConnected) {
                this.data = {
                    requests: requests.map(request => ({ ...request, result: null })),
                };
            }
        }
    }

    registerEvent(e: Event) {
        e.preventDefault();

        const event: CustomEvent = (e as CustomEvent);
        this.requestGeneration++;
        this.data = {
            requests: [
                ...this.data.requests.filter(request => request.id !== event.target),
                { request: event.detail, id: event.target },
            ],
        };

        if (this.timeoutHandler) {
            clearTimeout(this.timeoutHandler);
        }

        this.timeoutHandler = setTimeout(() => this.batch(), 100);
    }

    private resetRequests() {
        this.requestGeneration++;
        this.data = { requests: [] };
    }

    render() {
        return html`<slot></slot>`;
    }
}
