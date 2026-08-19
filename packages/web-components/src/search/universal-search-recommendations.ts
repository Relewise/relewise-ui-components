import { css, html, nothing, PropertyValues, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import type { UniversalSearchRecommendationBlock } from '../app';
import { Events } from '../helpers/events';
import { RecommendationStateChangedEventDetail } from '../recommendations/recommendation-state';
import { RelewiseLitElement } from '../relewise-lit-element';
import { theme } from '../theme';

const defaultTitles: Record<UniversalSearchRecommendationBlock['type'], string> = {
    PopularProducts: 'Popular products',
    PersonalProducts: 'Recommended products',
    RecentlyViewedProducts: 'Recently viewed products',
    PopularProductCategories: 'Popular categories',
    PopularContents: 'Popular content',
    PersonalContent: 'Recommended content',
    PopularContentCategories: 'Popular content categories',
    PopularSearchTerms: 'Popular searches',
    SearchTermBasedProduct: 'Recommended products',
};

const partByType: Record<UniversalSearchRecommendationBlock['type'], string> = {
    PopularProducts: 'popular-products',
    PersonalProducts: 'personal-products',
    RecentlyViewedProducts: 'recently-viewed-products',
    PopularProductCategories: 'popular-product-categories',
    PopularContents: 'popular-contents',
    PersonalContent: 'personal-content',
    PopularContentCategories: 'popular-content-categories',
    PopularSearchTerms: 'popular-search-term-recommendations',
    SearchTermBasedProduct: 'search-term-based-products',
};

const productRecommendationTypes = new Set<UniversalSearchRecommendationBlock['type']>([
    'PopularProducts',
    'PersonalProducts',
    'RecentlyViewedProducts',
    'SearchTermBasedProduct',
]);

const pendingState: RecommendationStateChangedEventDetail = {
    loading: true,
    hasResults: false,
};

export class UniversalSearchRecommendations extends RelewiseLitElement {
    @property({ attribute: false })
    configuration: UniversalSearchRecommendationBlock[] = [];

    @property()
    term = '';

    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string;

    @property({ type: Boolean })
    active = true;

    private recommendationStates: RecommendationStateChangedEventDetail[] = [];

    private lastReportedState?: RecommendationStateChangedEventDetail;

    protected willUpdate(changedProperties: PropertyValues<this>): void {
        if (changedProperties.has('configuration')
            || changedProperties.has('term')
            || changedProperties.has('displayedAtLocation')
            || changedProperties.has('active')) {
            this.recommendationStates = this.active
                ? this.configuration.map(() => pendingState)
                : [];
        }
    }

    protected updated(changedProperties: PropertyValues<this>): void {
        super.updated(changedProperties);
        if (changedProperties.has('configuration')
            || changedProperties.has('term')
            || changedProperties.has('displayedAtLocation')
            || changedProperties.has('active')) {
            this.reportState();
        }
    }

    private get state(): RecommendationStateChangedEventDetail {
        return {
            loading: this.recommendationStates.some(state => state.loading),
            hasResults: this.recommendationStates.some(state => state.hasResults),
        };
    }

    private handleRecommendationStateChanged(
        index: number,
        event: CustomEvent<RecommendationStateChangedEventDetail>,
    ): void {
        event.stopPropagation();
        const state = event.detail;
        queueMicrotask(() => {
            if (!this.isConnected) {
                return;
            }

            this.recommendationStates = this.recommendationStates.map((currentState, stateIndex) =>
                stateIndex === index ? state : currentState);
            this.requestUpdate();
            this.reportState();
        });
    }

    private reportState(): void {
        const state = this.state;
        if (this.lastReportedState?.loading === state.loading
            && this.lastReportedState.hasResults === state.hasResults) {
            return;
        }

        this.lastReportedState = state;
        this.dispatchEvent(new CustomEvent<RecommendationStateChangedEventDetail>(Events.recommendationStateChanged, {
            bubbles: true,
            composed: true,
            detail: state,
        }));
    }

    private get shouldBatchProductRecommendations(): boolean {
        const productRecommendations = this.configuration.filter(recommendation =>
            productRecommendationTypes.has(recommendation.type));
        return productRecommendations.length > 1
            && productRecommendations.every(recommendation =>
                recommendation.type !== 'RecentlyViewedProducts'
                && (recommendation.type !== 'SearchTermBasedProduct' || Boolean(this.term)));
    }

    render() {
        if (!this.active || this.configuration.length === 0) {
            return nothing;
        }

        const blocks = this.configuration.map((recommendation, index) =>
            this.renderBlock(recommendation, index));
        const state = this.state;

        return html`
            <div class="rw-recommendation-blocks" part="recommendation-blocks">
                ${state.loading && !state.hasResults ? html`
                    <div class="rw-recommendation-loading" part="recommendation-loading">
                        <relewise-loading-spinner></relewise-loading-spinner>
                    </div>
                ` : nothing}
                ${this.shouldBatchProductRecommendations
                ? html`<relewise-product-recommendation-batcher>${blocks}</relewise-product-recommendation-batcher>`
                : blocks}
            </div>
        `;
    }

    private renderBlock(recommendation: UniversalSearchRecommendationBlock, index: number): TemplateResult {
        const title = recommendation.title ?? defaultTitles[recommendation.type];
        const state = this.recommendationStates[index];
        const key = JSON.stringify({ index, recommendation, term: this.term, displayedAtLocation: this.displayedAtLocation });

        return html`
            <section
                class="rw-recommendation-block"
                part=${`recommendation-block ${partByType[recommendation.type]}`}
                ?hidden=${!state?.hasResults}
                @relewise-ui-components:recommendation-state-changed=${(event: CustomEvent<RecommendationStateChangedEventDetail>) => this.handleRecommendationStateChanged(index, event)}>
                ${title ? html`<h2 class="rw-recommendation-title" part="recommendation-title">${title}</h2>` : nothing}
                ${keyed(key, this.renderRecommendation(recommendation))}
            </section>
        `;
    }

    private renderRecommendation(recommendation: UniversalSearchRecommendationBlock): TemplateResult {
        const numberOfRecommendations = recommendation.take ?? 4;
        const displayedAtLocation = this.displayedAtLocation ?? 'Relewise Universal Search';

        switch (recommendation.type) {
        case 'PopularProducts':
            return html`
                <relewise-popular-products
                    part="recommendation-grid product-recommendation-grid"
                    exportparts="product-tile: recommendation-product-tile"
                    .numberOfRecommendations=${numberOfRecommendations}
                    .displayedAtLocation=${displayedAtLocation}>
                </relewise-popular-products>
            `;
        case 'PersonalProducts':
            return html`
                <relewise-personal-products
                    part="recommendation-grid product-recommendation-grid"
                    exportparts="product-tile: recommendation-product-tile"
                    .numberOfRecommendations=${numberOfRecommendations}
                    .displayedAtLocation=${displayedAtLocation}>
                </relewise-personal-products>
            `;
        case 'RecentlyViewedProducts':
            return html`
                <relewise-recently-viewed-products
                    part="recommendation-grid product-recommendation-grid"
                    exportparts="product-tile: recommendation-product-tile"
                    .numberOfRecommendations=${numberOfRecommendations}
                    .displayedAtLocation=${displayedAtLocation}>
                </relewise-recently-viewed-products>
            `;
        case 'PopularProductCategories':
            return html`
                <relewise-popular-product-categories
                    part="recommendation-grid category-recommendation-grid"
                    exportparts="category-tile: recommendation-category-tile"
                    .numberOfRecommendations=${numberOfRecommendations}
                    .displayedAtLocation=${displayedAtLocation}>
                </relewise-popular-product-categories>
            `;
        case 'PopularContents':
            return html`
                <relewise-popular-content
                    part="recommendation-grid content-recommendation-grid"
                    exportparts="content-tile: recommendation-content-tile"
                    .numberOfRecommendations=${numberOfRecommendations}
                    .displayedAtLocation=${displayedAtLocation}>
                </relewise-popular-content>
            `;
        case 'PersonalContent':
            return html`
                <relewise-personal-content
                    part="recommendation-grid content-recommendation-grid"
                    exportparts="content-tile: recommendation-content-tile"
                    .numberOfRecommendations=${numberOfRecommendations}
                    .displayedAtLocation=${displayedAtLocation}>
                </relewise-personal-content>
            `;
        case 'PopularContentCategories':
            return html`
                <relewise-popular-content-categories
                    part="recommendation-grid category-recommendation-grid"
                    exportparts="category-tile: recommendation-category-tile"
                    .numberOfRecommendations=${numberOfRecommendations}
                    .displayedAtLocation=${displayedAtLocation}>
                </relewise-popular-content-categories>
            `;
        case 'PopularSearchTerms':
            return html`
                <relewise-popular-search-terms
                    part="popular-search-term-recommendations"
                    exportparts="terms: recommendation-terms, term: recommendation-term"
                    .numberOfRecommendations=${numberOfRecommendations}
                    .displayedAtLocation=${displayedAtLocation}
                    .term=${this.term}>
                </relewise-popular-search-terms>
            `;
        case 'SearchTermBasedProduct':
            return html`
                <relewise-search-term-based-products
                    part="recommendation-grid product-recommendation-grid"
                    exportparts="product-tile: recommendation-product-tile"
                    .numberOfRecommendations=${numberOfRecommendations}
                    .displayedAtLocation=${displayedAtLocation}
                    .term=${this.term}>
                </relewise-search-term-based-products>
            `;
        }
    }

    static styles = [theme, css`
        :host {
            display: block;
            font-family: var(--font);
        }

        .rw-recommendation-blocks,
        relewise-product-recommendation-batcher {
            display: grid;
            gap: var(--relewise-universal-search-recommendation-block-gap, 2em);
        }

        .rw-recommendation-title {
            margin: 0 0 var(--relewise-universal-search-recommendation-title-margin-bottom, 1em);
        }

        .rw-recommendation-loading {
            display: flex;
            justify-content: center;
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-universal-search-recommendations': UniversalSearchRecommendations;
    }
}
