import { RelewiseLitElement } from '../relewise-lit-element';
import { html } from 'lit';
import { getRecommender } from './recommender';
import { getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { ProductRecommendationRequest, ProductRecommendationResponse, ProductsRecommendationCollectionBuilder } from '@relewise/client';
import { provide, createContext } from '@lit/context';
import { Events } from '../helpers';

const contextKey = Symbol('product-batcher');

export type BatchingContextValue = {
    requests: { request: ProductRecommendationRequest, id: Element, result?: ProductRecommendationResponse | null }[]
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
        const requests = this.activeRequests;
        if (requests.length !== this.data.requests.length) {
            this.data = { requests };
        }

        if (requests.length === 0) {
            // No recommendation components found to batch
            return;
        }

        const generation = ++this.requestGeneration;
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
                })).filter(request => this.isActive(request.id)),
            };
        } catch {
            if (generation === this.requestGeneration && this.isConnected) {
                this.data = {
                    requests: requests
                        .map(request => ({ ...request, result: null }))
                        .filter(request => this.isActive(request.id)),
                };
            }
        }
    }

    registerEvent(e: Event) {
        e.preventDefault();

        const event = e as CustomEvent<ProductRecommendationRequest>;
        const id = event.target as Element;
        this.requestGeneration++;
        this.data = {
            requests: [
                ...this.activeRequests.filter(request => request.id !== id),
                { request: event.detail, id },
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

    private get activeRequests() {
        return this.data.requests.filter(request => this.isActive(request.id));
    }

    private isActive(id: Element) {
        return id.isConnected && this.contains(id);
    }

    render() {
        return html`<slot></slot>`;
    }
}
