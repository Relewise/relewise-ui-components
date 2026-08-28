import { css, html, TemplateResult } from 'lit';
import type { PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events } from '../../helpers/events';
import { RecommendationStateElement } from '../recommendation-state';

export abstract class CategoryRecommendationBase<
    TCategory,
    TRequest,
    TResponse extends { recommendations?: TCategory[] | null },
> extends RecommendationStateElement {

    @property({ type: String, attribute: 'target' })
    target: string | null = null;

    @property({ type: Number, attribute: 'number-of-recommendations' })
    numberOfRecommendations = 4;

    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string;

    @state()
    categories: TCategory[] | null = null;

    protected abstract providedData?: {
        enabled?: boolean;
        requests: Array<{
            request: TRequest;
            id: EventTarget | null;
            result?: TResponse | null;
        }>;
    };
    protected abstract readonly registerRecommendationEvent: string;

    private requestGeneration = 0;
    private loading = false;

    abstract fetchCategories(): Promise<TResponse | undefined> | undefined;
    abstract buildRequest(): Promise<TRequest | undefined>;
    protected abstract renderCategory(category: TCategory): TemplateResult;

    private readonly fetchAndUpdateCategoriesBound = this.fetchAndUpdateCategories.bind(this);

    private get batchEnabled(): boolean {
        return this.providedData !== undefined && this.providedData.enabled !== false;
    }

    private get batchRequest() {
        return this.providedData?.requests.find(request => request.id === this);
    }

    private get renderedCategories(): TCategory[] | null {
        const batchRequest = this.batchRequest;
        if (this.batchEnabled && batchRequest && 'result' in batchRequest) {
            return batchRequest.result?.recommendations ?? null;
        }

        return this.categories;
    }

    connectedCallback() {
        super.connectedCallback();
        if (!this.displayedAtLocation) {
            console.error('Missing displayed-at-location attribute on recommendation component.');
        }

        window.addEventListener(Events.contextSettingsUpdated, this.fetchAndUpdateCategoriesBound);
        void this.fetchAndUpdateCategories();
    }

    disconnectedCallback() {
        this.requestGeneration++;
        window.removeEventListener(Events.contextSettingsUpdated, this.fetchAndUpdateCategoriesBound);
        super.disconnectedCallback();
    }

    protected updated(changedProperties: PropertyValues): void {
        super.updated(changedProperties);
        const previousData = changedProperties.get('providedData') as typeof this.providedData;
        if (previousData !== undefined && previousData.enabled !== false && !this.batchEnabled) {
            void this.fetchAndUpdateCategories();
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

    private async fetchAndUpdateCategories() {
        const generation = ++this.requestGeneration;
        this.loading = true;
        this.reportCurrentRecommendationState();
        let waitingForBatch = false;

        try {
            if (this.batchEnabled) {
                const request = await this.buildRequest();
                if (generation !== this.requestGeneration || !this.isConnected) {
                    return;
                }
                if (!request) {
                    this.categories = null;
                    return;
                }

                waitingForBatch = true;
                this.dispatchEvent(new CustomEvent(this.registerRecommendationEvent, {
                    bubbles: true,
                    composed: true,
                    detail: request,
                }));
                return;
            }

            const result = await this.fetchCategories();

            if (generation !== this.requestGeneration || !this.isConnected) {
                return;
            }

            this.categories = result?.recommendations ?? null;
        } catch {
            if (generation === this.requestGeneration && this.isConnected) {
                this.categories = null;
            }
        } finally {
            if (generation === this.requestGeneration && this.isConnected && !waitingForBatch) {
                this.loading = false;
                this.reportCurrentRecommendationState();
            }
        }
    }

    private reportCurrentRecommendationState(): void {
        this.reportRecommendationState({
            loading: this.loading,
            hasResults: Boolean(this.renderedCategories?.length),
        });
    }

    render() {
        const categories = this.renderedCategories;
        if (!categories || categories.length === 0) {
            return;
        }

        return html`${categories.map(category => this.renderCategory(category))}`;
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
