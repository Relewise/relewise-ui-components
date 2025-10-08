import { ContentRecommendationRequest, ContentRecommendationResponse, ContentResult } from '@relewise/client';
import { LitElement, css, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events } from '../../helpers/events';

export abstract class ContentRecommendationBase extends LitElement {

    @property({ type: String, attribute: 'target' })
    target: string | null = null;

    @property({ type: Number, attribute: 'number-of-recommendations' })
    numberOfRecommendations: number = 4;

    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string = undefined;

    @state()
    content: ContentResult[] | null = null;

    abstract fetchContent(): Promise<ContentRecommendationResponse | undefined> | undefined;
    abstract buildRequest(): Promise<ContentRecommendationRequest | undefined>;

    fetchAndUpdateContentBound = this.fetchAndUpdateContent.bind(this);

    constructor() {
        super();
        setTimeout(async() => {
            const request = await this.buildRequest();
            if (request) {
                this.dispatchEvent(new CustomEvent(Events.registerProductRecommendation, { bubbles: true, composed: true, detail: request }));
            }
        }, 0);
    }

    async connectedCallback() {
        super.connectedCallback();
        if (!this.displayedAtLocation) {
            console.error('Missing displayed-at-location attribute on recommendation component.');
        }

        await this.fetchAndUpdateContent();
        window.addEventListener(Events.contextSettingsUpdated, this.fetchAndUpdateContentBound);
    }

    disconnectedCallback() {
        window.removeEventListener(Events.contextSettingsUpdated, this.fetchAndUpdateContentBound);

        super.disconnectedCallback();
    }

    async fetchAndUpdateContent() {
        const result = await this.fetchContent();
        this.content = result?.recommendations ?? null;
    };

    render() {
        if (this.content && this.content.length > 0) {
            return html`${this.content.map(content => html`<relewise-content-tile .content=${content}></relewise-content-tile>`)}`;
        }
    }

    static styles = css`
        :host {
            display: grid;
            width: 100%;
            grid-template-columns: repeat(4,1fr);
            gap: 1em;
            grid-auto-rows: 1fr;
        }

        @media (max-width: 768px) {
            :host {
                grid-template-columns: repeat(2,1fr);
            }
        }    
    `;

}