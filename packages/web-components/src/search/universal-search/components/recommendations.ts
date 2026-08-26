import {
    ContentRecommendationRequest,
    ContentsRecommendationCollectionBuilder,
    ProductRecommendationRequest,
    ProductsRecommendationCollectionBuilder,
} from '@relewise/client';
import { provide } from '@lit/context';
import { css, html, nothing, PropertyValues, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import type { UniversalSearchRecommendationBlock } from '../../../app';
import { getRelewiseUIOptions } from '../../../helpers';
import { Events } from '../../../helpers/events';
import { RecommendationStateChangedEventDetail } from '../../../recommendations/recommendation-state';
import { ContentRecommendationBatchingContextValue, contentRecommendationBatchingContext } from '../../../recommendations/content/content-recommendation-batching';
import { BatchingContextValue, context as productRecommendationBatchingContext } from '../../../recommendations/product-recommendation-batcher';
import { getRecommender } from '../../../recommendations/recommender';
import { RelewiseLitElement } from '../../../relewise-lit-element';
import { theme } from '../../../theme';

interface RecommendationBlockRenderContext {
    take: number;
    displayedAtLocation: string;
    term: string;
}

interface RecommendationBlockDefinition {
    defaultTitle: string;
    part: string;
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
const productRecommendationTypes: ReadonlySet<UniversalSearchRecommendationBlock['type']> = new Set([
    'PopularProducts',
    'PersonalProducts',
    'RecentlyViewedProducts',
    'SearchTermBasedProduct',
]);
const contentRecommendationTypes: ReadonlySet<UniversalSearchRecommendationBlock['type']> = new Set([
    'PopularContents',
    'PersonalContent',
]);

export class UniversalSearchRecommendations extends RelewiseLitElement {
    @property({ attribute: false })
    configuration: UniversalSearchRecommendationBlock[] = [];

    @property()
    term = '';

    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string;

    @property({ type: Boolean })
    active = true;

    @provide({ context: productRecommendationBatchingContext })
    private productBatchData: BatchingContextValue = { enabled: false, requests: [] };

    @provide({ context: contentRecommendationBatchingContext })
    private contentBatchData: ContentRecommendationBatchingContextValue = { enabled: false, requests: [] };

    private recommendationStates: RecommendationStateChangedEventDetail[] = [];

    private lastReportedState?: RecommendationStateChangedEventDetail;

    private productBatchTimeout?: ReturnType<typeof setTimeout>;
    private contentBatchTimeout?: ReturnType<typeof setTimeout>;
    private productBatchAbortController = new AbortController();
    private contentBatchAbortController = new AbortController();
    private productBatchGeneration = 0;
    private contentBatchGeneration = 0;

    private readonly registerProductRecommendationBound = this.registerProductRecommendation.bind(this);
    private readonly registerContentRecommendationBound = this.registerContentRecommendation.bind(this);

    connectedCallback(): void {
        super.connectedCallback();
        this.renderRoot.addEventListener(Events.registerProductRecommendation, this.registerProductRecommendationBound);
        this.renderRoot.addEventListener(Events.registerContentRecommendation, this.registerContentRecommendationBound);
    }

    disconnectedCallback(): void {
        this.renderRoot.removeEventListener(Events.registerProductRecommendation, this.registerProductRecommendationBound);
        this.renderRoot.removeEventListener(Events.registerContentRecommendation, this.registerContentRecommendationBound);
        this.clearBatching();
        super.disconnectedCallback();
    }

    protected willUpdate(changedProperties: PropertyValues<this>): void {
        if (changedProperties.has('configuration')
            || changedProperties.has('term')
            || changedProperties.has('displayedAtLocation')
            || changedProperties.has('active')) {
            this.resetBatching();
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

    private resetBatching(): void {
        this.clearBatching();
        const configuration = this.active ? this.configuration : [];
        const productRecommendationCount = configuration.filter(block =>
            productRecommendationTypes.has(block.type)
            && (block.type !== 'SearchTermBasedProduct' || Boolean(this.term))).length;
        const contentRecommendationCount = configuration.filter(block =>
            contentRecommendationTypes.has(block.type)).length;

        this.productBatchData = { enabled: productRecommendationCount > 1, requests: [] };
        this.contentBatchData = { enabled: contentRecommendationCount > 1, requests: [] };
    }

    private clearBatching(): void {
        if (this.productBatchTimeout) {
            clearTimeout(this.productBatchTimeout);
            this.productBatchTimeout = undefined;
        }
        if (this.contentBatchTimeout) {
            clearTimeout(this.contentBatchTimeout);
            this.contentBatchTimeout = undefined;
        }

        this.productBatchAbortController.abort();
        this.contentBatchAbortController.abort();
        this.productBatchGeneration++;
        this.contentBatchGeneration++;
    }

    private registerProductRecommendation(event: Event): void {
        if (!this.productBatchData.enabled) {
            return;
        }

        event.stopPropagation();
        const recommendationEvent = event as CustomEvent<ProductRecommendationRequest>;
        const requests = this.productBatchData.requests
            .filter(request => request.id !== recommendationEvent.target);
        requests.push({ request: recommendationEvent.detail, id: recommendationEvent.target });
        this.productBatchData = { ...this.productBatchData, requests };

        if (this.productBatchTimeout) {
            clearTimeout(this.productBatchTimeout);
        }
        this.productBatchTimeout = setTimeout(() => void this.batchProductRecommendations(), 100);
    }

    private registerContentRecommendation(event: Event): void {
        if (!this.contentBatchData.enabled) {
            return;
        }

        event.stopPropagation();
        const recommendationEvent = event as CustomEvent<ContentRecommendationRequest>;
        const requests = this.contentBatchData.requests
            .filter(request => request.id !== recommendationEvent.target);
        requests.push({ request: recommendationEvent.detail, id: recommendationEvent.target });
        this.contentBatchData = { ...this.contentBatchData, requests };

        if (this.contentBatchTimeout) {
            clearTimeout(this.contentBatchTimeout);
        }
        this.contentBatchTimeout = setTimeout(() => void this.batchContentRecommendations(), 100);
    }

    private async batchProductRecommendations(): Promise<void> {
        this.productBatchTimeout = undefined;
        const requests = [...this.productBatchData.requests];
        if (requests.length < 2) {
            this.productBatchData = { enabled: false, requests: [] };
            return;
        }

        const generation = ++this.productBatchGeneration;
        this.productBatchAbortController.abort();
        const abortController = new AbortController();
        this.productBatchAbortController = abortController;
        const builder = new ProductsRecommendationCollectionBuilder()
            .requireDistinctProductsAcrossResults();
        requests.forEach(request => builder.addRequest(request.request));

        try {
            const response = await getRecommender(getRelewiseUIOptions())
                .batchProductRecommendations(builder.build(), { abortSignal: abortController.signal });
            if (abortController.signal.aborted || generation !== this.productBatchGeneration) {
                return;
            }

            this.productBatchData = {
                enabled: true,
                requests: requests.map((request, index) => ({
                    ...request,
                    result: response?.responses?.[index] ?? null,
                })),
            };
        } catch {
            if (!abortController.signal.aborted && generation === this.productBatchGeneration) {
                this.productBatchData = {
                    enabled: true,
                    requests: requests.map(request => ({ ...request, result: null })),
                };
            }
        }
    }

    private async batchContentRecommendations(): Promise<void> {
        this.contentBatchTimeout = undefined;
        const requests = [...this.contentBatchData.requests];
        if (requests.length < 2) {
            this.contentBatchData = { enabled: false, requests: [] };
            return;
        }

        const generation = ++this.contentBatchGeneration;
        this.contentBatchAbortController.abort();
        const abortController = new AbortController();
        this.contentBatchAbortController = abortController;
        const builder = new ContentsRecommendationCollectionBuilder()
            .requireDistinctContentsAcrossResults();
        requests.forEach(request => builder.addRequest(request.request));

        try {
            const response = await getRecommender(getRelewiseUIOptions())
                .batchContentRecommendations(builder.build(), { abortSignal: abortController.signal });
            if (abortController.signal.aborted || generation !== this.contentBatchGeneration) {
                return;
            }

            this.contentBatchData = {
                enabled: true,
                requests: requests.map((request, index) => ({
                    ...request,
                    result: response?.responses?.[index] ?? null,
                })),
            };
        } catch {
            if (!abortController.signal.aborted && generation === this.contentBatchGeneration) {
                this.contentBatchData = {
                    enabled: true,
                    requests: requests.map(request => ({ ...request, result: null })),
                };
            }
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
                ${blocks}
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

        .rw-recommendation-blocks {
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

        [part~="recommendation-grid"] {
            max-width: 100%;
            min-width: 0;
        }

        [part~="product-recommendation-grid"] {
            --relewise-recommendation-grid-columns: var(--relewise-universal-search-product-columns, var(--relewise-universal-search-result-columns, 5));
            --relewise-recommendation-grid-mobile-columns: var(--relewise-universal-search-mobile-product-columns, var(--relewise-universal-search-mobile-result-columns, 2));
        }

        [part~="category-recommendation-grid"] {
            --relewise-recommendation-grid-columns: var(--relewise-universal-search-category-columns, var(--relewise-universal-search-result-columns, var(--relewise-universal-search-product-columns, 5)));
            --relewise-recommendation-grid-mobile-columns: var(--relewise-universal-search-mobile-category-columns, var(--relewise-universal-search-mobile-result-columns, var(--relewise-universal-search-mobile-product-columns, 2)));
        }

        [part~="content-recommendation-grid"] {
            --relewise-recommendation-grid-columns: var(--relewise-universal-search-content-columns, var(--relewise-universal-search-result-columns, var(--relewise-universal-search-product-columns, 5)));
            --relewise-recommendation-grid-mobile-columns: var(--relewise-universal-search-mobile-content-columns, var(--relewise-universal-search-mobile-result-columns, var(--relewise-universal-search-mobile-product-columns, 2)));
        }

        [part~="recommendation-grid"]::part(recommendation-product-tile),
        [part~="recommendation-grid"]::part(recommendation-category-tile),
        [part~="recommendation-grid"]::part(recommendation-content-tile),
        [part~="product-tile"],
        [part~="category-tile"],
        [part~="content-tile"] {
            max-width: 100%;
            min-width: 0;
        }

        @container universal-search-dialog (width < 64rem) {
            [part~="product-recommendation-grid"] {
                --relewise-recommendation-grid-columns: var(--relewise-universal-search-mobile-product-columns, var(--relewise-universal-search-mobile-result-columns, 2));
            }

            [part~="category-recommendation-grid"] {
                --relewise-recommendation-grid-columns: var(--relewise-universal-search-mobile-category-columns, var(--relewise-universal-search-mobile-result-columns, var(--relewise-universal-search-mobile-product-columns, 2)));
            }

            [part~="content-recommendation-grid"] {
                --relewise-recommendation-grid-columns: var(--relewise-universal-search-mobile-content-columns, var(--relewise-universal-search-mobile-result-columns, var(--relewise-universal-search-mobile-product-columns, 2)));
            }
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-universal-search-recommendations': UniversalSearchRecommendations;
    }
}
