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

        const builder = new ProductsRecommendationCollectionBuilder();

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

        const newState: BatchingContextValue = { requests: this.data.requests };
        const event: CustomEvent = (e as CustomEvent);
        newState.requests.push({ request: event.detail, id: event.target });
        this.data = newState;

        if (this.timeoutHandler) {
            clearTimeout(this.timeoutHandler);
        }

        this.timeoutHandler = setTimeout(() => this.batch(), 100);
    }

    render() {
        return html`<slot></slot>`;
    }
}