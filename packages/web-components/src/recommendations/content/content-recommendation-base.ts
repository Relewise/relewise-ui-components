import { ContentRecommendationRequest, ContentRecommendationResponse, ContentResult, User } from '@relewise/client';
import { css, html, nothing } from 'lit';
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

    private get beforeResultsElements(): HTMLElement[] {
        return Array.from(this.children)
            .filter((element): element is HTMLElement => element instanceof HTMLElement && element.slot === 'before-results');
    }

    private renderContent() {
        return this.renderedContent?.map(content => html`
            <relewise-content-tile
                part="content-tile"
                .content=${content}
                .user=${this.user}>
            </relewise-content-tile>`);
    }

    render() {
        const hasResults = Boolean(this.renderedContent?.length);
        if (!hasResults) {
            return nothing;
        }

        const content = this.renderContent();
        if (this.beforeResultsElements.length === 0) {
            return content;
        }

        const contentGrid = html`
            <div
                class="rw-recommendation-grid rw-content-recommendation-grid"
                part="recommendation-grid content-recommendation-grid">
                ${content}
            </div>`;

        return html`
            <div class="rw-recommendation-layout">
                <slot name="before-results"></slot>
                ${contentGrid}
            </div>`;
    }

    static styles = css`
        :host {
            display: grid;
            width: 100%;
            grid-template-columns: repeat(var(--relewise-recommendation-grid-columns, 4), minmax(0, 1fr));
            gap: var(--relewise-recommendation-grid-gap, 1em);
            grid-auto-rows: 1fr;
        }

        :host:has(> [slot="before-results"]) {
            grid-auto-rows: auto;
        }

        :host:not(:has(.rw-recommendation-grid)) > [slot="before-results"] {
            display: none;
        }

        :host > product-and-variant-id,
        :host > content-id {
            display: none;
        }

        .rw-recommendation-layout,
        .rw-recommendation-grid,
        :host > [slot="before-results"] {
            grid-column: 1 / -1;
        }

        .rw-recommendation-layout {
            display: flex;
            flex-direction: column;
            gap: var(--relewise-recommendation-grid-gap, 1em);
            min-width: 0;
        }

        .rw-recommendation-grid {
            display: grid;
            width: 100%;
            grid-template-columns: repeat(var(--relewise-recommendation-grid-columns, 4), minmax(0, 1fr));
            gap: var(--relewise-recommendation-grid-gap, 1em);
            grid-auto-rows: 1fr;
        }

        @media (max-width: 768px) {
            :host,
            .rw-recommendation-grid {
                grid-template-columns: repeat(var(--relewise-recommendation-grid-mobile-columns, 2), minmax(0, 1fr));
            }
        }
    `;

}
