import {
    PopularSearchTermsRecommendationBuilder,
    RecommendPopularSearchTermSettings,
    SearchTermResult,
} from '@relewise/client';
import { css, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events } from '../../helpers/events';
import {
    getRelewiseContextSettings,
    getRelewiseRecommendationTargetedConfigurations,
    getRelewiseUIOptions,
} from '../../helpers/relewiseUIOptions';
import { RelewiseLitElement } from '../../relewise-lit-element';
import { getRecommender } from '../recommender';

export type PopularSearchTermEntityType = NonNullable<RecommendPopularSearchTermSettings['targetEntityTypes']>[number];
export type PopularSearchTermsTermSelectedEventDetail = { term: string };

export const PopularSearchTermsEvents = {
    termSelected: 'relewise-popular-search-terms-term-selected',
} as const;

type RenderableSearchTermResult = SearchTermResult & { term: string };

export class PopularSearchTerms extends RelewiseLitElement {

    @property({ type: String, attribute: 'target' })
    target: string | null = null;

    @property({ type: Number, attribute: 'number-of-recommendations' })
    numberOfRecommendations = 4;

    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string;

    @property({ type: String })
    term = '';

    @property({ attribute: false })
    targetEntityTypes: PopularSearchTermEntityType[] = [];

    @state()
    private recommendations: RenderableSearchTermResult[] = [];

    private readonly fetchAndUpdateRecommendationsBound = this.fetchAndUpdateRecommendations.bind(this);

    connectedCallback() {
        super.connectedCallback();
        if (!this.displayedAtLocation) {
            console.error('Missing displayed-at-location attribute on recommendation component.');
        }

        window.addEventListener(Events.contextSettingsUpdated, this.fetchAndUpdateRecommendationsBound);
        void this.fetchAndUpdateRecommendations();
    }

    disconnectedCallback() {
        window.removeEventListener(Events.contextSettingsUpdated, this.fetchAndUpdateRecommendationsBound);
        super.disconnectedCallback();
    }

    private async fetchAndUpdateRecommendations() {
        const recommender = getRecommender(getRelewiseUIOptions());
        const response = await recommender.recommendPopularSearchTerms(await this.buildRequest());
        this.recommendations = response?.recommendations?.filter(
            (recommendation): recommendation is RenderableSearchTermResult => Boolean(recommendation.term),
        ) ?? [];
    }

    async buildRequest() {
        await new Promise(resolve => setTimeout(resolve, 0));
        const settings = await getRelewiseContextSettings(this.displayedAtLocation ?? 'Relewise Popular Search Terms');
        const builder = new PopularSearchTermsRecommendationBuilder(settings)
            .setTerm(this.term || undefined)
            .take(this.numberOfRecommendations);

        if (this.targetEntityTypes.length > 0) {
            builder.addEntityType(...this.targetEntityTypes);
        }

        if (this.target) {
            getRelewiseRecommendationTargetedConfigurations().handle(this.target, builder);
        }

        return builder.build();
    }

    private selectTerm(term: string) {
        this.dispatchEvent(new CustomEvent<PopularSearchTermsTermSelectedEventDetail>(PopularSearchTermsEvents.termSelected, {
            bubbles: true,
            composed: true,
            detail: { term },
        }));
    }

    render() {
        if (this.recommendations.length === 0) {
            return;
        }

        return html`
            <ul class="rw-popular-search-terms" part="terms">
                ${this.recommendations.map(recommendation => html`
                    <li>
                        <button
                            class="rw-popular-search-term"
                            part="term"
                            type="button"
                            @click=${() => this.selectTerm(recommendation.term)}>
                            ${recommendation.term}
                        </button>
                    </li>
                `)}
            </ul>
        `;
    }

    static styles = css`
        :host {
            display: block;
        }

        .rw-popular-search-terms {
            display: flex;
            flex-wrap: wrap;
            gap: var(--relewise-popular-search-terms-gap, 0.5em);
            list-style: none;
            margin: 0;
            padding: 0;
        }

        .rw-popular-search-term {
            background: var(--relewise-popular-search-term-background, white);
            border: 1px solid var(--relewise-popular-search-term-border-color, #eee);
            border-radius: var(--relewise-popular-search-term-border-radius, 1em);
            color: inherit;
            cursor: pointer;
            font: inherit;
            padding: var(--relewise-popular-search-term-padding, 0.5em 0.75em);
        }

        .rw-popular-search-term:focus-visible {
            outline: 2px solid var(--relewise-focus-outline-color, #000);
            outline-offset: 2px;
        }
    `;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-popular-search-terms': PopularSearchTerms;
    }

    interface HTMLElementEventMap {
        'relewise-popular-search-terms-term-selected': CustomEvent<PopularSearchTermsTermSelectedEventDetail>;
    }
}
