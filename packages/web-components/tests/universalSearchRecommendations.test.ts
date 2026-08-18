import { assert, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import {
    ContentCategoryResult,
    ContentResult,
    ProductCategoryResult,
    ProductResult,
    Recommender,
    Searcher,
    UserFactory,
} from '@relewise/client';
import {
    clearUrlState,
    initializeRelewiseUI,
    UniversalSearch,
    useRecommendations,
    useSearch,
} from '../src';
import type { RecommendationStateChangedEventDetail, UniversalSearchRecommendationBlock } from '../src';
import { Events } from '../src/helpers/events';
import { UniversalSearchRecommendations } from '../src/search/universal-search-recommendations';
import { clearRegisteredLightDomStylesForTesting } from '../src/lightDomStyles';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

type UniversalSearchTestApi = {
    setSearchTerm: (term: string) => void;
};

function product(productId: string): ProductResult {
    return { productId, rank: 1, displayName: productId } as ProductResult;
}

function productCategory(categoryId: string): ProductCategoryResult {
    return { categoryId, rank: 1, displayName: categoryId } as ProductCategoryResult;
}

function content(contentId: string): ContentResult {
    return { contentId, rank: 1, displayName: contentId } as ContentResult;
}

function contentCategory(categoryId: string): ContentCategoryResult {
    return { categoryId, rank: 1, displayName: categoryId } as ContentCategoryResult;
}

function queryAllDeep<T extends Element>(root: Element | DocumentFragment, selector: string): T[] {
    const matches = [...root.querySelectorAll<T>(selector)];
    root.querySelectorAll('*').forEach(element => {
        if (element.shadowRoot) {
            matches.push(...queryAllDeep<T>(element.shadowRoot, selector));
        }
    });
    return matches;
}

function queryDeep<T extends Element>(element: UniversalSearch, selector: string): T | null {
    return queryAllDeep<T>(element.renderRoot, selector)[0] ?? null;
}

suite('universal search recommendations', () => {
    const originalBatchSearch = Searcher.prototype.batch;
    const originalBatchProducts = Recommender.prototype.batchProductRecommendations;
    const originalPopularProducts = Recommender.prototype.recommendPopularProducts;
    const originalRecentlyViewedProducts = Recommender.prototype.recentlyViewedProducts;
    const originalSearchTermBasedProducts = Recommender.prototype.recommendSearchTermBasedProducts;
    const originalPopularProductCategories = Recommender.prototype.recommendPopularProductCategories;
    const originalPopularContents = Recommender.prototype.recommendPopularContents;
    const originalPopularContentCategories = Recommender.prototype.recommendPopularContentCategories;
    const originalPopularSearchTerms = Recommender.prototype.recommendPopularSearchTerms;

    let productHits = 0;
    let productFacets: object | null = null;
    let lastSearchTerm: string | undefined;
    let popularProductRecommendations: ProductResult[] = [];
    let popularSearchTermEntityTypes: unknown;

    setup(() => {
        clearUrlState();
        productHits = 0;
        productFacets = null;
        lastSearchTerm = undefined;
        popularProductRecommendations = [product('popular')];
        popularSearchTermEntityTypes = undefined;

        Searcher.prototype.batch = async function(requestCollection) {
            return {
                responses: requestCollection.requests.map(request => {
                    lastSearchTerm = (request as { term?: string }).term ?? lastSearchTerm;
                    if (request.$type.includes('ProductCategorySearchRequest')) {
                        return {
                            $type: 'Relewise.Client.Responses.Search.ProductCategorySearchResponse, Relewise.Client',
                            hits: 0,
                            results: [],
                            facets: null,
                        };
                    }
                    if (request.$type.includes('ContentSearchRequest')) {
                        return {
                            $type: 'Relewise.Client.Responses.Search.ContentSearchResponse, Relewise.Client',
                            hits: 0,
                            results: [],
                            facets: null,
                        };
                    }
                    return {
                        $type: 'Relewise.Client.Responses.Search.ProductSearchResponse, Relewise.Client',
                        hits: productHits,
                        results: productHits > 0 ? [product('search-product')] : [],
                        facets: productFacets,
                    };
                }),
            } as never;
        };
        Recommender.prototype.batchProductRecommendations = async function(requestCollection) {
            return {
                responses: requestCollection.requests?.map(request => ({
                    recommendations: [product(request.$type.includes('SearchTermBased') ? 'term-based' : 'popular')],
                })),
            } as never;
        };
        Recommender.prototype.recommendPopularProducts = async function() {
            return { recommendations: popularProductRecommendations } as never;
        };
        Recommender.prototype.recentlyViewedProducts = async function() {
            return { recommendations: [product('recent')] } as never;
        };
        Recommender.prototype.recommendSearchTermBasedProducts = async function() {
            return { recommendations: [product('term-based')] } as never;
        };
        Recommender.prototype.recommendPopularProductCategories = async function() {
            return { recommendations: [productCategory('popular-category')] } as never;
        };
        Recommender.prototype.recommendPopularContents = async function() {
            return { recommendations: [content('popular-content')] } as never;
        };
        Recommender.prototype.recommendPopularContentCategories = async function() {
            return { recommendations: [contentCategory('popular-content-category')] } as never;
        };
        Recommender.prototype.recommendPopularSearchTerms = async function(request) {
            popularSearchTermEntityTypes = request.settings?.targetEntityTypes;
            return { recommendations: [{ term: 'Trail shoes', rank: 1 }] } as never;
        };
    });

    teardown(() => {
        clearUrlState();
        fixtureCleanup();
        clearRegisteredLightDomStylesForTesting();
        window.relewiseUISearchOptions = undefined!;
        window.relewiseUIRecommendationOptions = undefined!;
        window.relewiseUIOptions = undefined!;
        Searcher.prototype.batch = originalBatchSearch;
        Recommender.prototype.batchProductRecommendations = originalBatchProducts;
        Recommender.prototype.recommendPopularProducts = originalPopularProducts;
        Recommender.prototype.recentlyViewedProducts = originalRecentlyViewedProducts;
        Recommender.prototype.recommendSearchTermBasedProducts = originalSearchTermBasedProducts;
        Recommender.prototype.recommendPopularProductCategories = originalPopularProductCategories;
        Recommender.prototype.recommendPopularContents = originalPopularContents;
        Recommender.prototype.recommendPopularContentCategories = originalPopularContentCategories;
        Recommender.prototype.recommendPopularSearchTerms = originalPopularSearchTerms;
    });

    test('composes configured initial recommendations from standalone components', async() => {
        const options = mockRelewiseOptions();
        options.contextSettings.getUser = () => UserFactory.byTemporaryId('temporary-id');
        initializeRelewiseUI(options);
        useRecommendations({ popularSearchTerms: { targetEntityTypes: ['Content'] } });
        useSearch({
            universalSearch: {
                entities: { products: {}, productCategories: {}, content: {} },
                recommendations: {
                    initial: [
                        { type: 'PopularProducts', title: 'Products', take: 2 },
                        { type: 'RecentlyViewedProducts', title: 'Recent' },
                        { type: 'PopularProductCategories', title: 'Categories' },
                        { type: 'PopularContents', title: 'Content' },
                        { type: 'PopularContentCategories', title: 'Content categories' },
                        { type: 'PopularSearchTerms', title: 'Searches' },
                    ],
                },
            },
        });

        const element = await fixture<UniversalSearch>(html`<relewise-universal-search open></relewise-universal-search>`);
        await waitUntil(() => queryAllDeep(element.renderRoot, 'relewise-product-tile').length === 2);

        const composition = element.renderRoot.querySelector<UniversalSearchRecommendations>('relewise-universal-search-recommendations')!;
        assert.include(composition.getAttribute('exportparts') ?? '', 'recommendation-loading');
        assert.include(composition.getAttribute('exportparts') ?? '', 'recommendation-product-tile');
        const sections = [...composition.renderRoot.querySelectorAll<HTMLElement>('[part~="recommendation-block"]')];
        assert.deepEqual(
            sections.map(section => section.querySelector('[part="recommendation-title"]')?.textContent),
            ['Products', 'Recent', 'Categories', 'Content', 'Content categories', 'Searches'],
        );
        assert.equal(
            composition.renderRoot.querySelector<HTMLElement & { numberOfRecommendations: number }>('relewise-popular-products')?.numberOfRecommendations,
            2,
        );
        assert.equal(queryDeep(element, 'relewise-product-tile')?.getAttribute('part'), 'product-tile');
        assert.equal(queryDeep(element, 'relewise-content-tile')?.getAttribute('part'), 'content-tile');
        assert.equal(queryDeep(element, 'relewise-product-category-tile')?.getAttribute('part'), 'category-tile');
        assert.equal(queryDeep(element, 'relewise-content-category-tile')?.getAttribute('part'), 'category-tile');
        assert.include(
            queryDeep(element, 'relewise-popular-products')?.getAttribute('exportparts') ?? '',
            'product-tile: recommendation-product-tile',
        );
        assert.equal(queryDeep(element, '[part="term"]')?.textContent?.trim(), 'Trail shoes');
        assert.include(
            queryDeep(element, 'relewise-popular-search-terms')?.getAttribute('exportparts') ?? '',
            'term: recommendation-term',
        );
        assert.deepEqual(popularSearchTermEntityTypes, ['Content']);
        assert.lengthOf(element.renderRoot.querySelectorAll('[role="tab"]'), 0);
    });

    test('forwards recommendation tile parts through Universal Search', async() => {
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            universalSearch: {
                recommendations: {
                    initial: [
                        { type: 'PopularProducts' },
                        { type: 'PopularProductCategories' },
                        { type: 'PopularContents' },
                    ],
                },
            },
        });

        const wrapper = await fixture<HTMLElement>(html`
            <div>
                <style>
                    relewise-universal-search::part(recommendation-product-tile) {
                        outline: 7px solid rgb(1, 2, 3);
                    }
                    relewise-universal-search::part(recommendation-category-tile) {
                        outline: 8px solid rgb(1, 2, 3);
                    }
                    relewise-universal-search::part(recommendation-content-tile) {
                        outline: 9px solid rgb(1, 2, 3);
                    }
                </style>
                <relewise-universal-search open></relewise-universal-search>
            </div>
        `);
        const element = wrapper.querySelector<UniversalSearch>('relewise-universal-search')!;
        await waitUntil(() => queryDeep(element, 'relewise-content-tile') !== null);

        assert.equal(getComputedStyle(queryDeep(element, 'relewise-product-tile')!).outlineWidth, '7px');
        assert.equal(getComputedStyle(queryDeep(element, 'relewise-product-category-tile')!).outlineWidth, '8px');
        assert.equal(getComputedStyle(queryDeep(element, 'relewise-content-tile')!).outlineWidth, '9px');
    });

    test('shows the initial empty prompt after configured recommendations finish empty', async() => {
        let resolveRecommendations!: (value: unknown) => void;
        Recommender.prototype.recommendPopularProducts = () => new Promise(resolve => {
            resolveRecommendations = resolve;
        }) as never;
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            universalSearch: {
                recommendations: { initial: [{ type: 'PopularProducts' }] },
            },
        });

        const element = await fixture<UniversalSearch>(html`<relewise-universal-search open></relewise-universal-search>`);
        await waitUntil(() => queryDeep(element, '[part="recommendation-loading"]') !== null);
        await waitUntil(() => Boolean(resolveRecommendations));
        assert.isNull(element.renderRoot.querySelector('[part="empty-state"]'));

        resolveRecommendations({ recommendations: [] });
        await waitUntil(() => element.renderRoot.querySelector('[part="empty-state"]') !== null);
        assert.isNull(queryDeep(element, '[part="recommendation-loading"]'));
    });

    test('submits a selected popular search term', async() => {
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 100,
            universalSearch: {
                entities: { products: {} },
                recommendations: { initial: [{ type: 'PopularSearchTerms' }] },
            },
        });
        const element = await fixture<UniversalSearch>(html`<relewise-universal-search open></relewise-universal-search>`);
        await waitUntil(() => queryDeep<HTMLButtonElement>(element, '[part="term"]') !== null);
        const term = queryDeep<HTMLButtonElement>(element, '[part="term"]')!;

        term.click();

        await waitUntil(() => lastSearchTerm === 'Trail shoes');
        assert.equal(lastSearchTerm, 'Trail shoes');
    });

    test('hides active-tab facets only when its fallback has results', async() => {
        productFacets = { items: [] };
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {} },
                behavior: { zeroResultTabs: 'show' },
                recommendations: { noResults: { products: [{ type: 'PopularProducts' }] } },
            },
        });
        const element = await fixture<UniversalSearch>(html`<relewise-universal-search open></relewise-universal-search>`);

        (element as unknown as UniversalSearchTestApi).setSearchTerm('No matches');

        await waitUntil(() => element.renderRoot.querySelector('relewise-universal-search-products-tab') !== null);
        const productsTab = element.renderRoot.querySelector<HTMLElement & { hideFacets: boolean }>('relewise-universal-search-products-tab')!;
        await waitUntil(() => productsTab.hideFacets && queryDeep(element, 'relewise-product-tile') !== null);
        assert.isNull(queryAllDeep(productsTab.shadowRoot!, '[part="facets"]')[0] ?? null);
        assert.isNull(queryAllDeep(productsTab.shadowRoot!, '[part="zero-results"]')[0] ?? null);
    });

    test('keeps active-tab facets when its fallback is empty', async() => {
        productFacets = { items: [] };
        popularProductRecommendations = [];
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {} },
                behavior: { zeroResultTabs: 'show' },
                recommendations: { noResults: { products: [{ type: 'PopularProducts' }] } },
            },
        });
        const element = await fixture<UniversalSearch>(html`<relewise-universal-search open></relewise-universal-search>`);

        (element as unknown as UniversalSearchTestApi).setSearchTerm('No matches');

        await waitUntil(() => element.renderRoot.querySelector('relewise-universal-search-products-tab') !== null);
        const productsTab = element.renderRoot.querySelector<HTMLElement & { hideFacets: boolean }>('relewise-universal-search-products-tab')!;
        await waitUntil(() => queryDeep(element, '[part="recommendation-loading"]') === null);
        assert.isFalse(productsTab.hideFacets);
        assert.exists(queryAllDeep(productsTab.shadowRoot!, '[part="facets"]')[0]);
        assert.exists(queryAllDeep(productsTab.shadowRoot!, '[part="zero-results"]')[0]);
    });

    test('renders global recovery recommendations when zero-result tabs are hidden', async() => {
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {} },
                behavior: { zeroResultTabs: 'hide' },
                recommendations: { noResults: { global: [{ type: 'SearchTermBasedProduct' }] } },
            },
        });
        const element = await fixture<UniversalSearch>(html`<relewise-universal-search open></relewise-universal-search>`);

        (element as unknown as UniversalSearchTestApi).setSearchTerm('Boots');

        await waitUntil(() => queryDeep(element, 'relewise-product-tile') !== null);
        assert.lengthOf(element.renderRoot.querySelectorAll('[role="tab"]'), 0);
        assert.include(element.renderRoot.querySelector('[part="zero-results"]')?.textContent ?? '', 'No results');
    });

    test('batches multiple eligible product recommendation children', async() => {
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ universalSearch: {} });
        const states: RecommendationStateChangedEventDetail[] = [];
        const recommendations: UniversalSearchRecommendationBlock[] = [
            { type: 'PopularProducts' },
            { type: 'SearchTermBasedProduct' },
        ];

        const element = await fixture<UniversalSearchRecommendations>(html`
            <relewise-universal-search-recommendations
                .recommendations=${recommendations}
                term="Boots"
                @relewise-ui-components:recommendation-state-changed=${(event: CustomEvent<RecommendationStateChangedEventDetail>) => states.push(event.detail)}>
            </relewise-universal-search-recommendations>
        `);

        await waitUntil(() => queryAllDeep(element.renderRoot, 'relewise-product-tile').length === 2);
        assert.exists(element.renderRoot.querySelector('relewise-product-recommendation-batcher'));
        assert.deepInclude(states, { loading: true, hasResults: false });
        assert.deepInclude(states, { loading: false, hasResults: true });
        assert.equal(Events.recommendationStateChanged, 'relewise-ui-components:recommendation-state-changed');
    });

    test('finishes without results when a product recommendation batch fails', async() => {
        Recommender.prototype.batchProductRecommendations = async function() {
            throw new Error('Recommendations are unavailable');
        };
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ universalSearch: {} });
        const states: RecommendationStateChangedEventDetail[] = [];

        const element = await fixture<UniversalSearchRecommendations>(html`
            <relewise-universal-search-recommendations
                .recommendations=${[
                    { type: 'PopularProducts' as const },
                    { type: 'SearchTermBasedProduct' as const },
                ]}
                term="Boots"
                @relewise-ui-components:recommendation-state-changed=${(event: CustomEvent<RecommendationStateChangedEventDetail>) => states.push(event.detail)}>
            </relewise-universal-search-recommendations>
        `);

        await waitUntil(() => states.some(state => !state.loading && !state.hasResults));
        assert.isNull(element.renderRoot.querySelector('[part="recommendation-loading"]'));
        assert.lengthOf(queryAllDeep(element.renderRoot, 'relewise-product-tile'), 0);
    });

    test('renders the internal composition in Light DOM', async() => {
        const options = mockRelewiseOptions();
        options.components = { domMode: 'light' };
        initializeRelewiseUI(options);
        useSearch({ universalSearch: {} });

        const element = await fixture<UniversalSearchRecommendations>(html`
            <relewise-universal-search-recommendations
                .recommendations=${[
                    { type: 'PopularProducts' as const },
                    { type: 'SearchTermBasedProduct' as const },
                ]}
                term="Boots">
            </relewise-universal-search-recommendations>
        `);

        await waitUntil(() => element.querySelectorAll('relewise-product-tile').length === 2);
        assert.isNull(element.shadowRoot);
        assert.isNull(element.querySelector('relewise-product-recommendation-batcher')?.shadowRoot ?? null);
        assert.exists(element.querySelector('[part~="recommendation-block"]'));
        assert.equal(element.querySelector('relewise-product-tile')?.getAttribute('part'), 'product-tile');
        const registeredStyles = document.querySelector('#relewise-light-dom-styles');
        assert.include(registeredStyles?.textContent, 'relewise-universal-search-recommendations .rw-recommendation-blocks');
        assert.include(registeredStyles?.textContent, 'relewise-popular-products');
    });
});
