import { assert, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import { ContentCategoryResult, ContentResult, ProductCategoryResult, ProductResult, Recommender, Searcher, SearchTermResult, UserFactory } from '@relewise/client';
import { clearUrlState, initializeRelewiseUI, RecommendationBlocks, UniversalSearch, useSearch } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

type UniversalSearchTestApi = {
    setSearchTerm: (term: string) => void;
    handleSelectTab: (tab: 'products' | 'productCategories' | 'content') => void;
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

function queryRecommendationElements<T extends Element>(element: UniversalSearch, selector: string): T[] {
    return [...element.renderRoot.querySelectorAll<RecommendationBlocks>('relewise-recommendation-blocks')]
        .flatMap(blocks => [...blocks.renderRoot.querySelectorAll<T>(selector)]);
}

function queryRecommendationElement<T extends Element>(element: UniversalSearch, selector: string): T | null {
    return queryRecommendationElements<T>(element, selector)[0] ?? null;
}

suite('universal search recommendation blocks', () => {
    const originalBatchSearch = Searcher.prototype.batch;
    const originalBatchProducts = Recommender.prototype.batchProductRecommendations;
    const originalBatchContent = Recommender.prototype.batchContentRecommendations;
    const originalPopularProducts = Recommender.prototype.recommendPopularProducts;
    const originalRecentlyViewedProducts = Recommender.prototype.recentlyViewedProducts;
    const originalSearchTermBasedProducts = Recommender.prototype.recommendSearchTermBasedProducts;
    const originalPopularProductCategories = Recommender.prototype.recommendPopularProductCategories;
    const originalPopularContents = Recommender.prototype.recommendPopularContents;
    const originalPopularContentCategories = Recommender.prototype.recommendPopularContentCategories;
    const originalPopularSearchTerms = Recommender.prototype.recommendPopularSearchTerms;
    let productHits = 0;
    let productCategoryHits = 0;
    let contentHits = 0;
    let searchTermBasedRequestTerm: string | undefined;
    let popularSearchTermTargetEntityTypes: unknown;
    let failContentCategoryRecommendations = false;
    let failFirstProductCategoryRecommendation = false;
    let failFirstContentCategoryRecommendation = false;
    let failNextBatchSearch = false;
    let batchSearchGate: Promise<void> | null = null;
    let batchSearches = 0;
    let productFacets: object | null = null;
    let popularProductCalls = 0;
    let popularProductRecommendations: ProductResult[] = [];
    let failNextPopularProductRecommendation = false;
    let popularProductCategoryCalls = 0;
    let popularContentCalls = 0;
    let popularContentCategoryCalls = 0;
    let popularSearchTermCalls = 0;
    let popularSearchTermRecommendations: SearchTermResult[] = [];

    setup(() => {
        clearUrlState();
        productHits = 0;
        productCategoryHits = 0;
        contentHits = 0;
        searchTermBasedRequestTerm = undefined;
        popularSearchTermTargetEntityTypes = undefined;
        failContentCategoryRecommendations = false;
        failFirstProductCategoryRecommendation = false;
        failFirstContentCategoryRecommendation = false;
        failNextBatchSearch = false;
        batchSearchGate = null;
        batchSearches = 0;
        productFacets = null;
        popularProductCalls = 0;
        popularProductRecommendations = [product('recommended')];
        failNextPopularProductRecommendation = false;
        popularProductCategoryCalls = 0;
        popularContentCalls = 0;
        popularContentCategoryCalls = 0;
        popularSearchTermCalls = 0;
        popularSearchTermRecommendations = [{ term: 'Trail shoes', rank: 1 }];

        Searcher.prototype.batch = async function(requestCollection) {
            await batchSearchGate;
            batchSearches++;
            if (failNextBatchSearch) {
                failNextBatchSearch = false;
                throw new Error('Search is unavailable');
            }

            return {
                responses: requestCollection.requests.map(request => {
                    if (request.$type.includes('ProductCategorySearchRequest')) {
                        return {
                            $type: 'Relewise.Client.Responses.Search.ProductCategorySearchResponse, Relewise.Client',
                            hits: productCategoryHits,
                            results: productCategoryHits ? [productCategory('search-category')] : [],
                            facets: null,
                        };
                    }
                    if (request.$type.includes('ContentSearchRequest')) {
                        return {
                            $type: 'Relewise.Client.Responses.Search.ContentSearchResponse, Relewise.Client',
                            hits: contentHits,
                            results: contentHits ? [content('search-content')] : [],
                            facets: null,
                        };
                    }
                    return {
                        $type: 'Relewise.Client.Responses.Search.ProductSearchResponse, Relewise.Client',
                        hits: productHits,
                        results: productHits ? [product('search-product')] : [],
                        facets: productFacets,
                    };
                }),
            } as any;
        };

        Recommender.prototype.batchProductRecommendations = async function(requestCollection) {
            return {
                responses: requestCollection.requests?.map(request => {
                    if (request.$type.includes('SearchTermBasedProductRecommendationRequest')) {
                        searchTermBasedRequestTerm = (request as { term: string }).term;
                    }
                    return { recommendations: [product(request.$type.includes('RecentlyViewedProductsRequest') ? 'recent' : 'recommended')] };
                }),
            } as any;
        };
        Recommender.prototype.recommendPopularProducts = async function() {
            popularProductCalls++;
            if (failNextPopularProductRecommendation) {
                failNextPopularProductRecommendation = false;
                throw new Error('Popular products are unavailable');
            }
            return { recommendations: popularProductRecommendations } as any;
        };
        Recommender.prototype.recentlyViewedProducts = async function() {
            return { recommendations: [product('recent')] } as any;
        };
        Recommender.prototype.recommendSearchTermBasedProducts = async function(request) {
            searchTermBasedRequestTerm = request.term;
            return { recommendations: [product('recommended')] } as any;
        };
        Recommender.prototype.recommendPopularProductCategories = async function() {
            popularProductCategoryCalls++;
            if (failFirstProductCategoryRecommendation && popularProductCategoryCalls === 1) {
                throw new Error('Product category recommendations are unavailable');
            }
            return { recommendations: [productCategory('popular-category')] } as any;
        };
        Recommender.prototype.batchContentRecommendations = async function(requestCollection) {
            return { responses: requestCollection.requests?.map(() => ({ recommendations: [content('popular-content')] })) } as any;
        };
        Recommender.prototype.recommendPopularContents = async function() {
            popularContentCalls++;
            return { recommendations: [content('popular-content')] } as any;
        };
        Recommender.prototype.recommendPopularContentCategories = async function() {
            popularContentCategoryCalls++;
            if (failContentCategoryRecommendations || (failFirstContentCategoryRecommendation && popularContentCategoryCalls === 1)) {
                throw new Error('Content category recommendations are unavailable');
            }
            return { recommendations: [contentCategory('popular-content-category')] } as any;
        };
        Recommender.prototype.recommendPopularSearchTerms = async function(request) {
            popularSearchTermCalls++;
            popularSearchTermTargetEntityTypes = request.settings?.targetEntityTypes;
            return { recommendations: popularSearchTermRecommendations } as any;
        };
    });

    teardown(() => {
        clearUrlState();
        fixtureCleanup();
        window.relewiseUISearchOptions = undefined!;
        window.relewiseUIOptions = undefined!;
        Searcher.prototype.batch = originalBatchSearch;
        Recommender.prototype.batchProductRecommendations = originalBatchProducts;
        Recommender.prototype.batchContentRecommendations = originalBatchContent;
        Recommender.prototype.recommendPopularProducts = originalPopularProducts;
        Recommender.prototype.recentlyViewedProducts = originalRecentlyViewedProducts;
        Recommender.prototype.recommendSearchTermBasedProducts = originalSearchTermBasedProducts;
        Recommender.prototype.recommendPopularProductCategories = originalPopularProductCategories;
        Recommender.prototype.recommendPopularContents = originalPopularContents;
        Recommender.prototype.recommendPopularContentCategories = originalPopularContentCategories;
        Recommender.prototype.recommendPopularSearchTerms = originalPopularSearchTerms;
    });

    test('renders consumer-selected initial blocks in order without result tabs', async() => {
        const options = mockRelewiseOptions();
        options.contextSettings.getUser = () => UserFactory.byTemporaryId('temporary-id');
        initializeRelewiseUI(options);
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {}, productCategories: {}, content: {} },
                recommendations: {
                    initial: [
                        { type: 'PopularProducts', title: 'Products' },
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
        await waitUntil(() => queryRecommendationElements(element, '[part~="recommendation-block"]').length === 6, 'initial blocks were not rendered');

        assert.exists(element.renderRoot.querySelector('relewise-search-combobox'));
        const recommendationBlocks = element.renderRoot.querySelector('relewise-recommendation-blocks');
        assert.include(recommendationBlocks?.getAttribute('exportparts') ?? '', 'recommendation-loading');
        assert.include(recommendationBlocks?.getAttribute('exportparts') ?? '', 'recommendation-product-tile');
        assert.include(recommendationBlocks?.getAttribute('exportparts') ?? '', 'popular-search-term-recommendations');
        assert.lengthOf(element.renderRoot.querySelectorAll('[role="tab"]'), 0);
        assert.deepEqual(
            queryRecommendationElements(element, '[part="recommendation-title"]').map(title => title.textContent),
            ['Products', 'Recent', 'Categories', 'Content', 'Content categories', 'Searches'],
        );
        assert.lengthOf(queryRecommendationElements(element, 'relewise-product-tile'), 2);
        assert.lengthOf(queryRecommendationElements(element, 'relewise-category-tile'), 2);
        assert.lengthOf(queryRecommendationElements(element, 'relewise-content-tile'), 1);
        assert.equal(queryRecommendationElement(element, '[part="recommendation-term"]')?.textContent?.trim(), 'Trail shoes');
        assert.exists(queryRecommendationElement(element, '[part~="popular-search-term-recommendations"]'));
        assert.isNull(queryRecommendationElement(element, '[part~="popular-search-terms"]'));
        assert.deepEqual(popularSearchTermTargetEntityTypes, ['Product', 'ProductCategory', 'Content']);
        assert.equal(popularProductCategoryCalls, 1);
        assert.equal(popularContentCalls, 1);
        assert.equal(popularContentCategoryCalls, 1);
    });

    test('uses the configured content-category template', async() => {
        const options = mockRelewiseOptions();
        options.templates = {
            contentCategory: (category, { html }) => html`<span class="custom-content-category">${category.displayName}</span>`,
        };
        initializeRelewiseUI(options);
        useSearch({
            universalSearch: {
                entities: { products: {} },
                recommendations: {
                    initial: [{ type: 'PopularContentCategories' }],
                },
            },
        });

        const element = await fixture<UniversalSearch>(html`<relewise-universal-search open></relewise-universal-search>`);
        await waitUntil(() => queryRecommendationElement(element, 'relewise-category-tile') !== null, 'content category was not rendered');
        const tile = queryRecommendationElement(element, 'relewise-category-tile') as HTMLElement & { renderRoot: HTMLElement | DocumentFragment; updateComplete: Promise<boolean> };
        await tile.updateComplete;

        assert.equal(tile.renderRoot.querySelector('.custom-content-category')?.textContent, 'popular-content-category');
    });

    test('searches with the API term when a recommendation term is selected', async() => {
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {} },
                recommendations: {
                    initial: [{ type: 'PopularSearchTerms' }],
                },
            },
        });

        const element = await fixture<UniversalSearch>(html`<relewise-universal-search open></relewise-universal-search>`);
        await waitUntil(
            () => queryRecommendationElement<HTMLButtonElement>(element, '[part="recommendation-term"]'),
            'search term recommendation was not rendered',
        );
        const recommendation = queryRecommendationElement<HTMLButtonElement>(element, '[part="recommendation-term"]')!;
        recommendation.click();

        await waitUntil(
            () => element.renderRoot.querySelector('[part="results-summary"] strong')?.textContent === 'Trail shoes',
            'selected search term was not submitted',
        );
    });

    test('keeps successful blocks when another recommendation endpoint fails', async() => {
        failContentCategoryRecommendations = true;
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            universalSearch: {
                entities: { products: {} },
                recommendations: {
                    initial: [
                        { type: 'PopularProducts' },
                        { type: 'PopularContentCategories' },
                    ],
                },
            },
        });

        const element = await fixture<UniversalSearch>(html`<relewise-universal-search open></relewise-universal-search>`);
        await waitUntil(() => queryRecommendationElement(element, '[part="recommendation-product-tile"]') !== null, 'successful block was not rendered');

        assert.lengthOf(queryRecommendationElements(element, '[part~="recommendation-block"]'), 1);
    });

    test('keeps successful category blocks when another request of the same type fails', async() => {
        failFirstProductCategoryRecommendation = true;
        failFirstContentCategoryRecommendation = true;
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            universalSearch: {
                entities: { products: {} },
                recommendations: {
                    initial: [
                        { type: 'PopularProductCategories', title: 'Unavailable product categories' },
                        { type: 'PopularProductCategories', title: 'Product categories' },
                        { type: 'PopularContentCategories', title: 'Unavailable content categories' },
                        { type: 'PopularContentCategories', title: 'Content categories' },
                    ],
                },
            },
        });

        const element = await fixture<UniversalSearch>(html`<relewise-universal-search open></relewise-universal-search>`);
        await waitUntil(() => queryRecommendationElements(element, '[part="recommendation-category-tile"]').length === 2, 'successful category blocks were not rendered');

        assert.deepEqual(
            queryRecommendationElements(element, '[part="recommendation-title"]').map(title => title.textContent),
            ['Product categories', 'Content categories'],
        );
        assert.equal(popularProductCategoryCalls, 2);
        assert.equal(popularContentCategoryCalls, 2);
    });

    test('renders global recovery blocks when every zero-result tab is hidden', async() => {
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            localization: {
                universalSearch: {
                    noResults: 'Nothing matched your search.',
                },
            },
            universalSearch: {
                entities: { products: {}, productCategories: {}, content: {} },
                behavior: { zeroResultTabs: 'hide' },
                recommendations: {
                    noResults: {
                        global: [{ type: 'SearchTermBasedProduct', title: 'Try these instead' }],
                    },
                },
            },
        });

        const element = await fixture<UniversalSearch>(html`<relewise-universal-search open></relewise-universal-search>`);
        (element as unknown as UniversalSearchTestApi).setSearchTerm('No matches');

        await waitUntil(() => queryRecommendationElement(element, '[part="recommendation-product-tile"]') !== null, 'global recovery block was not rendered');
        assert.lengthOf(element.renderRoot.querySelectorAll('[role="tab"]'), 0);
        assert.equal(element.renderRoot.querySelector('[part="zero-results"]')?.textContent?.trim(), 'Nothing matched your search.');
        assert.equal(searchTermBasedRequestTerm, 'No matches');
    });

    test('renders the active tab recovery blocks when zero-result tabs remain visible', async() => {
        productFacets = { items: [] };
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {} },
                recommendations: {
                    noResults: {
                        products: [{ type: 'PopularProducts', title: 'Popular products' }],
                    },
                },
            },
        });

        const element = await fixture<UniversalSearch>(html`<relewise-universal-search open></relewise-universal-search>`);
        (element as unknown as UniversalSearchTestApi).setSearchTerm('No products');

        await waitUntil(() => queryRecommendationElement(element, '[part="recommendation-product-tile"]') !== null, 'tab recovery block was not rendered');
        assert.lengthOf(element.renderRoot.querySelectorAll('[role="tab"]'), 1);
        const productsTab = element.renderRoot.querySelector<HTMLElement & { renderRoot: HTMLElement | DocumentFragment }>('relewise-universal-search-products-tab')!;
        await waitUntil(() => productsTab.renderRoot.querySelector('[part="facets"]') === null, 'facets were not hidden');
        assert.isNull(productsTab.renderRoot.querySelector('[part="facets"]'));
    });

    test('loads no-result recommendations when a tab is selected and reuses its cached result', async() => {
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {}, productCategories: {}, content: {} },
                recommendations: {
                    noResults: {
                        products: [{ type: 'PopularProducts' }],
                        productCategories: [{ type: 'PopularProductCategories' }],
                        content: [{ type: 'PopularContents' }],
                    },
                },
            },
        });

        const element = await fixture<UniversalSearch>(html`<relewise-universal-search open></relewise-universal-search>`);
        const api = element as unknown as UniversalSearchTestApi;
        api.setSearchTerm('No matches');

        await waitUntil(() => popularProductCalls === 1, 'active product fallback was not loaded');
        assert.equal(popularProductCategoryCalls, 0);
        assert.equal(popularContentCalls, 0);

        api.handleSelectTab('productCategories');
        await waitUntil(() => popularProductCategoryCalls === 1, 'product category fallback was not loaded on selection');
        assert.equal(popularContentCalls, 0);

        api.handleSelectTab('products');
        await waitUntil(() => queryRecommendationElement(element, '[part="recommendation-product-tile"]') !== null, 'cached product fallback was not restored');
        assert.equal(popularProductCalls, 1);
    });

    test('caches an empty fallback response and keeps facets available', async() => {
        productFacets = { items: [] };
        popularProductRecommendations = [];
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {}, productCategories: {} },
                recommendations: {
                    noResults: {
                        products: [{ type: 'PopularProducts' }],
                    },
                },
            },
        });

        const element = await fixture<UniversalSearch>(html`<relewise-universal-search open></relewise-universal-search>`);
        const api = element as unknown as UniversalSearchTestApi;
        api.setSearchTerm('No matches');

        await waitUntil(() => popularProductCalls === 1, 'empty product fallback was not loaded');
        const productsTab = element.renderRoot.querySelector<HTMLElement & { renderRoot: HTMLElement | DocumentFragment }>('relewise-universal-search-products-tab')!;
        await waitUntil(() => productsTab.renderRoot.querySelector('[part="facets"]') !== null, 'facets were not retained');

        api.handleSelectTab('productCategories');
        await element.updateComplete;
        api.handleSelectTab('products');
        await element.updateComplete;
        await new Promise(resolve => setTimeout(resolve, 0));

        assert.equal(popularProductCalls, 1);
        assert.exists(productsTab.renderRoot.querySelector('[part="facets"]'));
    });

    test('ignores popular search term recommendations without a term and keeps facets available', async() => {
        productFacets = { items: [] };
        popularSearchTermRecommendations = [
            { term: null, rank: 1 },
            { rank: 2 },
        ];
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {} },
                recommendations: {
                    noResults: {
                        products: [{ type: 'PopularSearchTerms' }],
                    },
                },
            },
        });

        const element = await fixture<UniversalSearch>(html`<relewise-universal-search open></relewise-universal-search>`);
        (element as unknown as UniversalSearchTestApi).setSearchTerm('No matches');

        await waitUntil(
            () => popularSearchTermCalls === 1 && queryRecommendationElement(element, '[part="recommendation-loading"]') === null,
            'invalid popular search terms were not processed',
        );
        const productsTab = element.renderRoot.querySelector<HTMLElement & { renderRoot: HTMLElement | DocumentFragment; updateComplete: Promise<boolean> }>('relewise-universal-search-products-tab')!;
        await productsTab.updateComplete;

        assert.isNull(queryRecommendationElement(element, '[part~="recommendation-block"]'));
        assert.exists(productsTab.renderRoot.querySelector('[part="facets"]'));
    });

    test('retries a failed fallback request when its tab is selected again', async() => {
        failNextPopularProductRecommendation = true;
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {}, productCategories: {} },
                recommendations: {
                    noResults: {
                        products: [{ type: 'PopularProducts' }],
                    },
                },
            },
        });

        const element = await fixture<UniversalSearch>(html`<relewise-universal-search open></relewise-universal-search>`);
        const api = element as unknown as UniversalSearchTestApi;
        api.setSearchTerm('No matches');

        await waitUntil(() => popularProductCalls === 1, 'failed product fallback was not requested');
        api.handleSelectTab('productCategories');
        await element.updateComplete;
        api.handleSelectTab('products');

        await waitUntil(() => queryRecommendationElement(element, '[part="recommendation-product-tile"]') !== null, 'product fallback was not retried');
        assert.equal(popularProductCalls, 2);
    });

    test('only auto-selects the first tab with results when leaving the initial state', async() => {
        productHits = 0;
        contentHits = 1;
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {}, content: {} },
            },
        });

        const element = await fixture<UniversalSearch>(html`<relewise-universal-search open></relewise-universal-search>`);
        const api = element as unknown as UniversalSearchTestApi;
        api.setSearchTerm('First search');
        await waitUntil(() => element.renderRoot.querySelector('[role="tab"][aria-selected="true"]')?.textContent?.includes('Content') === true, 'content tab was not selected');

        api.handleSelectTab('products');
        api.setSearchTerm('Refined search');
        await waitUntil(() => element.renderRoot.querySelector('[role="tab"] [part="tab-count"]') !== null, 'refined search did not complete');

        assert.include(element.renderRoot.querySelector('[role="tab"][aria-selected="true"]')?.textContent ?? '', 'Products');
    });

    test('does not auto-select another tab after the initial search fails', async() => {
        productHits = 0;
        contentHits = 1;
        failNextBatchSearch = true;
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {}, content: {} },
            },
        });

        const element = await fixture<UniversalSearch>(html`<relewise-universal-search open></relewise-universal-search>`);
        const api = element as unknown as UniversalSearchTestApi;
        api.setSearchTerm('Failed search');
        await waitUntil(() => {
            const productsTab = element.renderRoot.querySelector<HTMLElement & { renderRoot: HTMLElement | DocumentFragment }>('relewise-universal-search-products-tab');
            return Boolean(productsTab?.renderRoot.querySelector('[part="error-state"]'));
        }, 'initial search did not fail');

        api.setSearchTerm('Retry search');
        await waitUntil(() => batchSearches >= 2, 'retry search did not complete');
        await element.updateComplete;

        assert.include(element.renderRoot.querySelector('[role="tab"][aria-selected="true"]')?.textContent ?? '', 'Products');
    });

    test('respects disabled initial tab activation', async() => {
        productHits = 0;
        contentHits = 1;
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {}, content: {} },
                behavior: { activateFirstTabWithResultsFromInitialState: false },
            },
        });

        const element = await fixture<UniversalSearch>(html`<relewise-universal-search open></relewise-universal-search>`);
        (element as unknown as UniversalSearchTestApi).setSearchTerm('First search');
        await waitUntil(
            () => element.renderRoot.querySelector('[role="tab"] [part="tab-count"]') !== null,
            'search did not complete',
        );

        assert.include(element.renderRoot.querySelector('[role="tab"][aria-selected="true"]')?.textContent ?? '', 'Products');
    });

    test('does not override a tab selected while the initial search is pending', async() => {
        productHits = 1;
        contentHits = 0;
        let releaseBatchSearch!: () => void;
        batchSearchGate = new Promise(resolve => {
            releaseBatchSearch = resolve;
        });
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {}, content: {} },
            },
        });

        const element = await fixture<UniversalSearch>(html`<relewise-universal-search open></relewise-universal-search>`);
        const api = element as unknown as UniversalSearchTestApi;
        api.setSearchTerm('First search');
        await waitUntil(() => element.renderRoot.querySelectorAll('[role="tab"]').length === 2, 'tabs were not rendered');
        api.handleSelectTab('content');
        releaseBatchSearch();

        await waitUntil(
            () => element.renderRoot.querySelector('[role="tab"] [part="tab-count"]') !== null,
            'search did not complete',
        );
        assert.include(element.renderRoot.querySelector('[role="tab"][aria-selected="true"]')?.textContent ?? '', 'Content');
    });
});
