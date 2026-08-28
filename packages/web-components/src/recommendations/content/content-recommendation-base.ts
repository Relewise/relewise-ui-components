import { ContentRecommendationRequest, ContentRecommendationResponse, ContentResult, User } from '@relewise/client';
import { css, html } from 'lit';
import type { PropertyValues } from 'lit';
import { consume } from '@lit/context';
import { property, state } from 'lit/decorators.js';
import { Events } from '../../helpers/events';
import { getRelewiseUIOptions } from '../../helpers';
import { RecommendationStateElement } from '../recommendation-state';
import { ContentRecommendationBatchingContextValue, contentRecommendationBatchingContext } from './content-recommendation-batching';

export abstract class ContentRecommendationBase extends RecommendationStateElement {

    @property({ type: String, attribute: 'target' })
    target: string | null = null;

    @property({ type: Number, attribute: 'number-of-recommendations' })
    numberOfRecommendations: number = 4;

    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string = undefined;

    @consume({ context: contentRecommendationBatchingContext, subscribe: true })
    @state()
    private providedData?: ContentRecommendationBatchingContextValue;

    @state()
    content: ContentResult[] | null = null;

    @state()
    private user: User | null = null;

    private requestGeneration = 0;
    private loading = false;

    abstract fetchContent(): Promise<ContentRecommendationResponse | undefined> | undefined;
    abstract buildRequest(): Promise<ContentRecommendationRequest | undefined>;

    fetchAndUpdateContentBound = this.fetchAndUpdateContent.bind(this);

    private get batchEnabled(): boolean {
        return this.providedData !== undefined && this.providedData.enabled !== false;
    }

    private get batchRequest() {
        return this.providedData?.requests.find(request => request.id === this);
    }

    private get renderedContent(): ContentResult[] | null {
        const batchRequest = this.batchRequest;
        if (this.batchEnabled && batchRequest && 'result' in batchRequest) {
            return batchRequest.result?.recommendations ?? null;
        }

        return this.content;
    }

    async connectedCallback() {
        super.connectedCallback();
        if (!this.displayedAtLocation) {
            console.error('Missing displayed-at-location attribute on recommendation component.');
        }

        window.addEventListener(Events.contextSettingsUpdated, this.fetchAndUpdateContentBound);
        void this.fetchAndUpdateContent();
    }

    disconnectedCallback() {
        this.requestGeneration++;
        window.removeEventListener(Events.contextSettingsUpdated, this.fetchAndUpdateContentBound);

        super.disconnectedCallback();
    }

    protected updated(changedProperties: PropertyValues): void {
        super.updated(changedProperties);
        const previousData = changedProperties.get('providedData') as ContentRecommendationBatchingContextValue | undefined;
        if (previousData !== undefined && previousData.enabled !== false && !this.batchEnabled) {
            void this.fetchAndUpdateContent();
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

    async fetchAndUpdateContent() {
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
                    this.content = null;
                    return;
                }

                waitingForBatch = true;
                this.dispatchEvent(new CustomEvent(Events.registerContentRecommendation, {
                    bubbles: true,
                    composed: true,
                    detail: request,
                }));
                return;
            }

            const result = await this.fetchContent();

            if (generation !== this.requestGeneration || !this.isConnected) {
                return;
            }

            this.content = result?.recommendations ?? null;
        } catch {
            if (generation === this.requestGeneration && this.isConnected) {
                this.content = null;
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
            hasResults: Boolean(this.renderedContent?.length),
        });
    }

    render() {
        return html`${this.renderedContent?.map(content =>
            html`<relewise-content-tile part="content-tile" .content=${content} .user=${this.user}></relewise-content-tile>`)}`;
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
