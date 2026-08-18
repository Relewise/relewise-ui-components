import { ContentRecommendationRequest, ContentRecommendationResponse, ContentResult, User } from '@relewise/client';
import { css, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events } from '../../helpers/events';
import { getRelewiseUIOptions } from '../../helpers';
import { RecommendationStateElement } from '../recommendation-state';

export abstract class ContentRecommendationBase extends RecommendationStateElement {

    @property({ type: String, attribute: 'target' })
    target: string | null = null;

    @property({ type: Number, attribute: 'number-of-recommendations' })
    numberOfRecommendations: number = 4;

    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string = undefined;

    @state()
    content: ContentResult[] | null = null;

    @state()
    private user: User | null = null;

    private requestGeneration = 0;
    private loading = false;

    abstract fetchContent(): Promise<ContentRecommendationResponse | undefined> | undefined;
    abstract buildRequest(): Promise<ContentRecommendationRequest | undefined>;

    fetchAndUpdateContentBound = this.fetchAndUpdateContent.bind(this);

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

    async fetchAndUpdateContent() {
        const generation = ++this.requestGeneration;
        this.loading = true;
        this.reportCurrentRecommendationState();

        try {
            const user = await getRelewiseUIOptions().contextSettings.getUser();

            if (generation !== this.requestGeneration || !this.isConnected) {
                return;
            }

            const result = await this.fetchContent();

            if (generation !== this.requestGeneration || !this.isConnected) {
                return;
            }

            this.user = user;
            this.content = result?.recommendations ?? null;
        } catch {
            if (generation === this.requestGeneration && this.isConnected) {
                this.content = null;
            }
        } finally {
            if (generation === this.requestGeneration && this.isConnected) {
                this.loading = false;
                this.reportCurrentRecommendationState();
            }
        }
    };

    private reportCurrentRecommendationState(): void {
        this.reportRecommendationState({
            loading: this.loading,
            hasResults: Boolean(this.content?.length),
        });
    }

    render() {
        if (this.content && this.content.length > 0) {
            return html`${this.content.map(content => html`<relewise-content-tile .content=${content} .user=${this.user}></relewise-content-tile>`)}`;
        }
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
