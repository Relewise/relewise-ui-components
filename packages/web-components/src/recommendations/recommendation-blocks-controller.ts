import {
    ContentCategoryResult,
    ContentResult,
    ContentsRecommendationCollectionBuilder,
    ProductCategoryResult,
    ProductResult,
    type ProductRecommendationResponse,
    type PopularContentsRequest,
    type PopularProductsRequest,
    ProductsRecommendationCollectionBuilder,
    type RecentlyViewedProductsRequest,
    type Recommender,
    type SearchTermBasedProductRecommendationRequest,
    SearchTermResult,
    User,
} from '@relewise/client';
import { html, nothing } from 'lit';
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { RecommendationBlock, SearchSuggestionEntityType } from '../app';
import { getRelewiseContextSettings, getRelewiseUIOptions } from '../helpers';
import { getRecommender } from './recommender';
import {
    buildRecommendationBlockRequest,
    PreparedRecommendationBlock,
} from './recommendationBlockRequestBuilder';

type RecommendationBlocksControllerOptions = {
    getDisplayedAtLocation: () => string;
    getTargetEntityTypes: () => SearchSuggestionEntityType[];
    selectSearchTerm: (term: string) => void;
};

type RecommendationBlockResult =
    | { block: RecommendationBlock; resultType: 'products'; recommendations: ProductResult[] }
    | { block: RecommendationBlock; resultType: 'productCategories'; recommendations: ProductCategoryResult[] }
    | { block: RecommendationBlock; resultType: 'content'; recommendations: ContentResult[] }
    | { block: RecommendationBlock; resultType: 'contentCategories'; recommendations: ContentCategoryResult[] }
    | { block: RecommendationBlock; resultType: 'searchTerms'; recommendations: RenderableSearchTermResult[] };

type RenderableSearchTermResult = SearchTermResult & { term: string };

type RecommendationCacheEntry = {
    results: RecommendationBlockResult[];
    user: User;
};

const defaultTitles: Record<RecommendationBlock['type'], string> = {
    PopularProducts: 'Popular products',
    RecentlyViewedProducts: 'Recently viewed products',
    PopularProductCategories: 'Popular categories',
    PopularContents: 'Popular content',
    PopularContentCategories: 'Popular content categories',
    PopularSearchTerms: 'Popular searches',
    SearchTermBasedProduct: 'Recommended products',
};

const partByType: Record<RecommendationBlock['type'], string> = {
    PopularProducts: 'popular-products',
    RecentlyViewedProducts: 'recently-viewed-products',
    PopularProductCategories: 'popular-product-categories',
    PopularContents: 'popular-contents',
    PopularContentCategories: 'popular-content-categories',
    PopularSearchTerms: 'popular-search-term-recommendations',
    SearchTermBasedProduct: 'search-term-based-products',
};

export class RecommendationBlocksController implements ReactiveController {
    private results: RecommendationBlockResult[] = [];
    private loading = false;
    private user: User | null = null;
    private abortController = new AbortController();
    private readonly cache = new Map<string, RecommendationCacheEntry>();

    constructor(
        private readonly host: ReactiveControllerHost,
        private readonly options: RecommendationBlocksControllerOptions,
    ) {
        this.host.addController(this);
    }

    hostDisconnected(): void {
        this.abortController.abort();
    }

    get hasResults(): boolean {
        return this.results.length > 0;
    }

    get isLoading(): boolean {
        return this.loading;
    }

    clear(): void {
        this.abortController.abort();
        this.results = [];
        this.loading = false;
        this.host.requestUpdate();
    }

    clearCache(): void {
        this.cache.clear();
        this.clear();
    }

    async load(blocks: RecommendationBlock[], term: string, cacheKey?: string): Promise<void> {
        this.abortController.abort();
        this.results = [];

        const resolvedCacheKey = cacheKey ? `${cacheKey}:${JSON.stringify(blocks)}` : null;
        const cached = resolvedCacheKey ? this.cache.get(resolvedCacheKey) : undefined;
        if (cached) {
            this.results = cached.results;
            this.user = cached.user;
            this.loading = false;
            this.host.requestUpdate();
            return;
        }

        if (blocks.length === 0) {
            this.loading = false;
            this.host.requestUpdate();
            return;
        }

        const abortController = new AbortController();
        this.abortController = abortController;
        this.loading = true;
        this.host.requestUpdate();

        try {
            // Allow runtime recommendation filters to register before the requests are built.
            await new Promise(resolve => setTimeout(resolve, 0));
            const settings = await getRelewiseContextSettings(this.options.getDisplayedAtLocation());
            if (abortController.signal.aborted) {
                return;
            }

            this.user = settings.user;
            const targetEntityTypes = this.options.getTargetEntityTypes();
            const prepared = blocks
                .map(block => buildRecommendationBlockRequest({ block, settings, targetEntityTypes, term }))
                .filter((request): request is PreparedRecommendationBlock => request !== null);

            const response = await this.fetchRecommendations(prepared, abortController.signal);
            if (!abortController.signal.aborted) {
                this.results = response.results;
                if (resolvedCacheKey && response.complete) {
                    this.cache.set(resolvedCacheKey, {
                        results: response.results,
                        user: settings.user,
                    });
                }
            }
        } catch {
            if (!abortController.signal.aborted) {
                this.results = [];
            }
        } finally {
            if (!abortController.signal.aborted) {
                this.loading = false;
                this.host.requestUpdate();
            }
        }
    }

    render() {
        if (this.loading && this.results.length === 0) {
            return html`
                <div class="rw-recommendation-loading" part="recommendation-loading">
                    <relewise-loading-spinner></relewise-loading-spinner>
                </div>
            `;
        }

        if (this.results.length === 0) {
            return nothing;
        }

        return html`
            <div class="rw-recommendation-blocks" part="recommendation-blocks">
                ${this.results.map(result => this.renderBlock(result))}
            </div>
        `;
    }

    private async fetchRecommendations(
        prepared: PreparedRecommendationBlock[],
        signal: AbortSignal,
    ): Promise<{ results: RecommendationBlockResult[]; complete: boolean }> {
        const recommender = getRecommender(getRelewiseUIOptions());
        const recommendations = new Map<PreparedRecommendationBlock, RecommendationBlockResult['recommendations']>();
        const products = prepared.filter((item): item is Extract<PreparedRecommendationBlock, { resultType: 'products' }> => item.resultType === 'products');
        const productCategories = prepared.filter((item): item is Extract<PreparedRecommendationBlock, { resultType: 'productCategories' }> => item.resultType === 'productCategories');
        const content = prepared.filter((item): item is Extract<PreparedRecommendationBlock, { resultType: 'content' }> => item.resultType === 'content');
        const contentCategories = prepared.filter((item): item is Extract<PreparedRecommendationBlock, { resultType: 'contentCategories' }> => item.resultType === 'contentCategories');
        const searchTerms = prepared.filter((item): item is Extract<PreparedRecommendationBlock, { resultType: 'searchTerms' }> => item.resultType === 'searchTerms');

        const outcomes = await Promise.allSettled([
            this.fetchProductRecommendations(recommender, products, recommendations, signal),
            this.fetchContentRecommendations(recommender, content, recommendations, signal),
            ...productCategories.map(async item => {
                const response = await recommender.recommendPopularProductCategories(item.request, { abortSignal: signal });
                recommendations.set(item, response?.recommendations ?? []);
            }),
            ...contentCategories.map(async item => {
                const response = await recommender.recommendPopularContentCategories(item.request, { abortSignal: signal });
                recommendations.set(item, response?.recommendations ?? []);
            }),
            ...searchTerms.map(async item => {
                const response = await recommender.recommendPopularSearchTerms(item.request, { abortSignal: signal });
                const renderableRecommendations = response?.recommendations?.filter(
                    (recommendation): recommendation is RenderableSearchTermResult => recommendation.term !== null && recommendation.term !== undefined,
                ) ?? [];
                recommendations.set(item, renderableRecommendations);
            }),
        ]);

        const results = prepared.flatMap(item => {
            const items = recommendations.get(item) ?? [];
            if (items.length === 0) {
                return [];
            }

            return [{
                block: item.block,
                resultType: item.resultType,
                recommendations: items,
            } as RecommendationBlockResult];
        });

        return {
            results,
            complete: outcomes.every(outcome => outcome.status === 'fulfilled'),
        };
    }

    private async fetchProductRecommendations(
        recommender: Recommender,
        requests: Extract<PreparedRecommendationBlock, { resultType: 'products' }>[],
        recommendations: Map<PreparedRecommendationBlock, RecommendationBlockResult['recommendations']>,
        signal: AbortSignal,
    ): Promise<void> {
        if (requests.length === 0) {
            return;
        }

        if (requests.length === 1) {
            const item = requests[0];
            const options = { abortSignal: signal };
            let response: ProductRecommendationResponse | undefined;
            switch (item.block.type) {
            case 'PopularProducts':
                response = await recommender.recommendPopularProducts(item.request as PopularProductsRequest, options);
                break;
            case 'RecentlyViewedProducts':
                response = await recommender.recentlyViewedProducts(item.request as RecentlyViewedProductsRequest, options);
                break;
            case 'SearchTermBasedProduct':
                response = await recommender.recommendSearchTermBasedProducts(item.request as SearchTermBasedProductRecommendationRequest, options);
                break;
            default:
                return;
            }
            recommendations.set(item, response?.recommendations ?? []);
            return;
        }

        const builder = new ProductsRecommendationCollectionBuilder();
        requests.forEach(item => builder.addRequest(item.request));
        const response = await recommender.batchProductRecommendations(builder.build(), { abortSignal: signal });
        requests.forEach((item, index) => recommendations.set(item, response?.responses?.[index]?.recommendations ?? []));
    }

    private async fetchContentRecommendations(
        recommender: Recommender,
        requests: Extract<PreparedRecommendationBlock, { resultType: 'content' }>[],
        recommendations: Map<PreparedRecommendationBlock, RecommendationBlockResult['recommendations']>,
        signal: AbortSignal,
    ): Promise<void> {
        if (requests.length === 0) {
            return;
        }

        if (requests.length === 1) {
            const item = requests[0];
            const response = await recommender.recommendPopularContents(item.request as PopularContentsRequest, { abortSignal: signal });
            recommendations.set(item, response?.recommendations ?? []);
            return;
        }

        const builder = new ContentsRecommendationCollectionBuilder();
        requests.forEach(item => builder.addRequest(item.request));
        const response = await recommender.batchContentRecommendations(builder.build(), { abortSignal: signal });
        requests.forEach((item, index) => recommendations.set(item, response?.responses?.[index]?.recommendations ?? []));
    }

    private renderBlock(result: RecommendationBlockResult) {
        const title = result.block.title ?? defaultTitles[result.block.type];
        return html`
            <section class="rw-recommendation-block" part="recommendation-block ${partByType[result.block.type]}">
                ${title ? html`<h2 class="rw-recommendation-title" part="recommendation-title">${title}</h2>` : nothing}
                ${this.renderRecommendations(result)}
            </section>
        `;
    }

    private renderRecommendations(result: RecommendationBlockResult) {
        switch (result.resultType) {
        case 'products':
            return html`
                    <div class="rw-recommendation-grid" part="recommendation-grid product-recommendation-grid">
                        ${result.recommendations.map(product => html`
                            <relewise-product-tile part="recommendation-product-tile" .product=${product} .user=${this.user}></relewise-product-tile>
                        `)}
                    </div>
                `;
        case 'productCategories':
            return html`
                    <div class="rw-recommendation-grid" part="recommendation-grid category-recommendation-grid">
                        ${result.recommendations.map(category => html`
                            <relewise-category-tile part="recommendation-category-tile" .category=${category} .user=${this.user}></relewise-category-tile>
                        `)}
                    </div>
                `;
        case 'content':
            return html`
                    <div class="rw-recommendation-grid" part="recommendation-grid content-recommendation-grid">
                        ${result.recommendations.map(content => html`
                            <relewise-content-tile part="recommendation-content-tile" .content=${content} .user=${this.user}></relewise-content-tile>
                        `)}
                    </div>
                `;
        case 'contentCategories':
            return html`
                    <div class="rw-recommendation-grid" part="recommendation-grid category-recommendation-grid">
                        ${result.recommendations.map(category => html`
                            <relewise-category-tile content-category part="recommendation-category-tile" .category=${category} .user=${this.user}></relewise-category-tile>
                        `)}
                    </div>
                `;
        case 'searchTerms':
            return html`
                    <ul class="rw-recommendation-terms" part="recommendation-terms">
                        ${result.recommendations.map(recommendation => html`
                            <li>
                                <button
                                    class="rw-recommendation-term"
                                    part="recommendation-term"
                                    type="button"
                                    @click=${() => this.options.selectSearchTerm(recommendation.term)}>
                                    ${recommendation.term}
                                </button>
                            </li>
                        `)}
                    </ul>
                `;
        }
    }
}
