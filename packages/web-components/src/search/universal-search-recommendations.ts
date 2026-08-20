import { css, html, nothing, PropertyValues, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import type { UniversalSearchRecommendationBlock } from '../app';
import { Events } from '../helpers/events';
import { RecommendationStateChangedEventDetail } from '../recommendations/recommendation-state';
import { RelewiseLitElement } from '../relewise-lit-element';
import { theme } from '../theme';

interface RecommendationBlockRenderContext {
    take: number;
    displayedAtLocation: string;
    term: string;
}

interface RecommendationBlockDefinition {
    defaultTitle: string;
    part: string;
    productRecommendation: boolean;
    batchable: (term: string) => boolean;
    render: (context: RecommendationBlockRenderContext) => TemplateResult;
}

type RecommendationBlockDefinitions = Record<
    UniversalSearchRecommendationBlock['type'],
    RecommendationBlockDefinition
>;

const recommendationBlockDefinitions = {
    PopularProducts: {
        defaultTitle: 'Popular products',
        part: 'popular-products',
        productRecommendation: true,
        batchable: () => true,
        render: context => html`
            <relewise-popular-products
                part="recommendation-grid product-recommendation-grid"
                exportparts="product-tile: recommendation-product-tile"
                .numberOfRecommendations=${context.take}
                .displayedAtLocation=${context.displayedAtLocation}>
            </relewise-popular-products>
        `,
    },
    PersonalProducts: {
        defaultTitle: 'Recommended products',
        part: 'personal-products',
        productRecommendation: true,
        batchable: () => true,
        render: context => html`
            <relewise-personal-products
                part="recommendation-grid product-recommendation-grid"
                exportparts="product-tile: recommendation-product-tile"
                .numberOfRecommendations=${context.take}
                .displayedAtLocation=${context.displayedAtLocation}>
            </relewise-personal-products>
        `,
    },
    RecentlyViewedProducts: {
        defaultTitle: 'Recently viewed products',
        part: 'recently-viewed-products',
        productRecommendation: true,
        batchable: () => false,
        render: context => html`
            <relewise-recently-viewed-products
                part="recommendation-grid product-recommendation-grid"
                exportparts="product-tile: recommendation-product-tile"
                .numberOfRecommendations=${context.take}
                .displayedAtLocation=${context.displayedAtLocation}>
            </relewise-recently-viewed-products>
        `,
    },
    PopularProductCategories: {
        defaultTitle: 'Popular categories',
        part: 'popular-product-categories',
        productRecommendation: false,
        batchable: () => false,
        render: context => html`
            <relewise-popular-product-categories
                part="recommendation-grid category-recommendation-grid"
                exportparts="category-tile: recommendation-category-tile"
                .numberOfRecommendations=${context.take}
                .displayedAtLocation=${context.displayedAtLocation}>
            </relewise-popular-product-categories>
        `,
    },
    PopularContents: {
        defaultTitle: 'Popular content',
        part: 'popular-contents',
        productRecommendation: false,
        batchable: () => false,
        render: context => html`
            <relewise-popular-content
                part="recommendation-grid content-recommendation-grid"
                exportparts="content-tile: recommendation-content-tile"
                .numberOfRecommendations=${context.take}
                .displayedAtLocation=${context.displayedAtLocation}>
            </relewise-popular-content>
        `,
    },
    PersonalContent: {
        defaultTitle: 'Recommended content',
        part: 'personal-content',
        productRecommendation: false,
        batchable: () => false,
        render: context => html`
            <relewise-personal-content
                part="recommendation-grid content-recommendation-grid"
                exportparts="content-tile: recommendation-content-tile"
                .numberOfRecommendations=${context.take}
                .displayedAtLocation=${context.displayedAtLocation}>
            </relewise-personal-content>
        `,
    },
    PopularContentCategories: {
        defaultTitle: 'Popular content categories',
        part: 'popular-content-categories',
        productRecommendation: false,
        batchable: () => false,
        render: context => html`
            <relewise-popular-content-categories
                part="recommendation-grid category-recommendation-grid"
                exportparts="category-tile: recommendation-category-tile"
                .numberOfRecommendations=${context.take}
                .displayedAtLocation=${context.displayedAtLocation}>
            </relewise-popular-content-categories>
        `,
    },
    PopularSearchTerms: {
        defaultTitle: 'Popular searches',
        part: 'popular-search-term-recommendations',
        productRecommendation: false,
        batchable: () => false,
        render: context => html`
            <relewise-popular-search-terms
                part="popular-search-term-recommendations"
                exportparts="terms: recommendation-terms, term: recommendation-term"
                .numberOfRecommendations=${context.take}
                .displayedAtLocation=${context.displayedAtLocation}
                .term=${context.term}>
            </relewise-popular-search-terms>
        `,
    },
    SearchTermBasedProduct: {
        defaultTitle: 'Recommended products',
        part: 'search-term-based-products',
        productRecommendation: true,
        batchable: term => Boolean(term),
        render: context => html`
            <relewise-search-term-based-products
                part="recommendation-grid product-recommendation-grid"
                exportparts="product-tile: recommendation-product-tile"
                .numberOfRecommendations=${context.take}
                .displayedAtLocation=${context.displayedAtLocation}
                .term=${context.term}>
            </relewise-search-term-based-products>
        `,
    },
} satisfies RecommendationBlockDefinitions;

const pendingState: RecommendationStateChangedEventDetail = {
    loading: true,
    hasResults: false,
};
const defaultNumberOfRecommendations = 5;

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
        const productRecommendations = this.configuration
            .map(configuration => recommendationBlockDefinitions[configuration.type])
            .filter(definition => definition.productRecommendation);
        return productRecommendations.length > 1
            && productRecommendations.every(definition => definition.batchable(this.term));
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

    private renderBlock(configuration: UniversalSearchRecommendationBlock, index: number): TemplateResult {
        const definition = recommendationBlockDefinitions[configuration.type];
        const title = configuration.title ?? definition.defaultTitle;
        const state = this.recommendationStates[index];
        const key = JSON.stringify({ index, configuration, term: this.term, displayedAtLocation: this.displayedAtLocation });
        const context: RecommendationBlockRenderContext = {
            take: configuration.take ?? defaultNumberOfRecommendations,
            displayedAtLocation: this.displayedAtLocation ?? 'Relewise Universal Search',
            term: this.term,
        };

        return html`
            <section
                class="rw-recommendation-block"
                part=${`recommendation-block ${definition.part}`}
                ?hidden=${!state?.hasResults}
                @relewise-ui-components:recommendation-state-changed=${(event: CustomEvent<RecommendationStateChangedEventDetail>) => this.handleRecommendationStateChanged(index, event)}>
                ${title ? html`<h2 class="rw-recommendation-title" part="recommendation-title">${title}</h2>` : nothing}
                ${keyed(key, definition.render(context))}
            </section>
        `;
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
