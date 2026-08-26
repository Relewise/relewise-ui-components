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
    QueryKeys,
    UniversalSearch,
    updateUrlState,
    useRecommendations,
    useSearch,
} from '../src';
import type { RecommendationStateChangedEventDetail, UniversalSearchRecommendationBlock } from '../src';
import { Events } from '../src/helpers/events';
import { UniversalSearchRecommendations } from '../src/search/universal-search/components/recommendations';
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
    const originalBatchContents = Recommender.prototype.batchContentRecommendations;
    const originalPopularProducts = Recommender.prototype.recommendPopularProducts;
    const originalPersonalProducts = Recommender.prototype.recommendPersonalProducts;
    const originalRecentlyViewedProducts = Recommender.prototype.recentlyViewedProducts;
    const originalSearchTermBasedProducts = Recommender.prototype.recommendSearchTermBasedProducts;
    const originalPopularProductCategories = Recommender.prototype.recommendPopularProductCategories;
    const originalPopularContents = Recommender.prototype.recommendPopularContents;
    const originalPersonalContents = Recommender.prototype.recommendPersonalContents;
    const originalPopularContentCategories = Recommender.prototype.recommendPopularContentCategories;
    const originalPopularSearchTerms = Recommender.prototype.recommendPopularSearchTerms;

    let productHits = 0;
    let productFacets: object | null = null;
    let lastSearchTerm: string | undefined;
    let popularProductRecommendations: ProductResult[] = [];
    let popularSearchTermEntityTypes: unknown;
    let productBatchRequests = 0;
    let contentBatchRequests = 0;
    let requireDistinctProductsAcrossResults: boolean | undefined;
    let requireDistinctContentsAcrossResults: boolean | undefined;
    let batchedSearchTermRecommendationTerms: string[] = [];
    let popularProductRequests = 0;
    let searchTermRecommendationTerms: string[] = [];
    let popularProductCategoryRequests = 0;
    let popularContentRequests = 0;

    setup(() => {
        clearUrlState();
        productHits = 0;
        productFacets = null;
        lastSearchTerm = undefined;
        popularProductRecommendations = [product('popular')];
        popularSearchTermEntityTypes = undefined;
        productBatchRequests = 0;
        popularProductRequests = 0;
        contentBatchRequests = 0;
        requireDistinctProductsAcrossResults = undefined;
        requireDistinctContentsAcrossResults = undefined;
        batchedSearchTermRecommendationTerms = [];
        searchTermRecommendationTerms = [];
        popularProductCategoryRequests = 0;
        popularContentRequests = 0;

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
            productBatchRequests++;
            requireDistinctProductsAcrossResults = requestCollection.requireDistinctProductsAcrossResults;
            return {
                responses: requestCollection.requests?.map(request => {
                    if (request.$type.includes('SearchTermBased')) {
                        batchedSearchTermRecommendationTerms.push((request as { term: string }).term);
                    }
                    const productId = request.$type.includes('Personal')
                        ? 'personal'
                        : request.$type.includes('RecentlyViewed')
                            ? 'recent'
                            : request.$type.includes('SearchTermBased')
                                ? 'term-based'
                                : 'popular';
                    return { recommendations: [product(productId)] };
                }),
            } as never;
        };
        Recommender.prototype.batchContentRecommendations = async function(requestCollection) {
            contentBatchRequests++;
            requireDistinctContentsAcrossResults = requestCollection.requireDistinctContentsAcrossResults;
            return {
                responses: requestCollection.requests?.map(request => ({
                    recommendations: [content(request.$type.includes('Personal') ? 'personal-content' : 'popular-content')],
                })),
            } as never;
        };
        Recommender.prototype.recommendPopularProducts = async function() {
            popularProductRequests++;
            return { recommendations: popularProductRecommendations } as never;
        };
        Recommender.prototype.recommendPersonalProducts = async function() {
            return { recommendations: [product('personal')] } as never;
        };
        Recommender.prototype.recentlyViewedProducts = async function() {
            return { recommendations: [product('recent')] } as never;
        };
        Recommender.prototype.recommendSearchTermBasedProducts = async function(request) {
            searchTermRecommendationTerms.push(request.term);
            return { recommendations: [product('term-based')] } as never;
        };
        Recommender.prototype.recommendPopularProductCategories = async function() {
            popularProductCategoryRequests++;
            return { recommendations: [productCategory('popular-category')] } as never;
        };
        Recommender.prototype.recommendPopularContents = async function() {
            popularContentRequests++;
            return { recommendations: [content('popular-content')] } as never;
        };
        Recommender.prototype.recommendPersonalContents = async function() {
            return { recommendations: [content('personal-content')] } as never;
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
        Recommender.prototype.batchContentRecommendations = originalBatchContents;
        Recommender.prototype.recommendPopularProducts = originalPopularProducts;
        Recommender.prototype.recommendPersonalProducts = originalPersonalProducts;
        Recommender.prototype.recentlyViewedProducts = originalRecentlyViewedProducts;
        Recommender.prototype.recommendSearchTermBasedProducts = originalSearchTermBasedProducts;
        Recommender.prototype.recommendPopularProductCategories = originalPopularProductCategories;
        Recommender.prototype.recommendPopularContents = originalPopularContents;
        Recommender.prototype.recommendPersonalContents = originalPersonalContents;
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
                        { type: 'PersonalProducts', title: 'Personal products' },
                        { type: 'RecentlyViewedProducts', title: 'Recent' },
                        { type: 'PopularProductCategories', title: 'Categories' },
                        { type: 'PopularContents', title: 'Content' },
                        { type: 'PersonalContent', title: 'Personal content' },
                        { type: 'PopularContentCategories', title: 'Content categories' },
                        { type: 'PopularSearchTerms', title: 'Searches' },
                    ],
                },
            },
        });

        const element = await fixture<UniversalSearch>(html`<relewise-universal-search open></relewise-universal-search>`);
        await waitUntil(() => queryAllDeep(element.renderRoot, 'relewise-product-tile').length >= 3
            && queryAllDeep(element.renderRoot, 'relewise-content-tile').length >= 2);

        const composition = element.renderRoot.querySelector<UniversalSearchRecommendations>('relewise-universal-search-recommendations')!;
        assert.include(composition.getAttribute('exportparts') ?? '', 'recommendation-loading');
        assert.include(composition.getAttribute('exportparts') ?? '', 'recommendation-product-tile');
        const sections = [...composition.renderRoot.querySelectorAll<HTMLElement>('[part~="recommendation-block"]')];
        assert.deepEqual(
            sections.map(section => section.querySelector('[part="recommendation-title"]')?.textContent),
            ['Products', 'Personal products', 'Recent', 'Categories', 'Content', 'Personal content', 'Content categories', 'Searches'],
        );
        assert.equal(
            composition.renderRoot.querySelector<HTMLElement & { numberOfRecommendations: number }>('relewise-popular-products')?.numberOfRecommendations,
            2,
        );
        assert.equal(
            composition.renderRoot.querySelector<HTMLElement & { numberOfRecommendations: number }>('relewise-personal-products')?.numberOfRecommendations,
            5,
        );
        assert.equal(queryDeep(element, 'relewise-product-tile')?.getAttribute('part'), 'product-tile');
        assert.equal(queryDeep(element, 'relewise-content-tile')?.getAttribute('part'), 'content-tile');
        assert.exists(queryDeep(element, 'relewise-personal-products'));
        assert.exists(queryDeep(element, 'relewise-personal-content'));
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
        assert.equal(productBatchRequests, 1);
        assert.equal(contentBatchRequests, 1);
        assert.isTrue(requireDistinctProductsAcrossResults);
        assert.isTrue(requireDistinctContentsAcrossResults);
        assert.equal(popularProductRequests, 0);
        assert.equal(popularContentRequests, 0);
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

    test('defaults recommendation columns to the Universal Search result columns', async() => {
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ universalSearch: {} });

        const element = await fixture<UniversalSearch>(html`<relewise-universal-search></relewise-universal-search>`);
        const styles = getComputedStyle(element);

        assert.equal(styles.getPropertyValue('--relewise-recommendation-grid-columns').trim(), '5');
        assert.equal(styles.getPropertyValue('--relewise-recommendation-grid-mobile-columns').trim(), '2');
    });

    test('uses progressively denser default product recommendation columns as the dialog widens', async() => {
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            universalSearch: {
                recommendations: { initial: [{ type: 'PopularProducts' }] },
            },
        });
        const element = await fixture<UniversalSearch>(html`
            <relewise-universal-search
                open
                style="--relewise-universal-search-width: 60rem;">
            </relewise-universal-search>
        `);
        await waitUntil(() => queryDeep(element, 'relewise-product-tile') !== null);
        const productGrid = queryDeep<HTMLElement>(element, 'relewise-popular-products')!;

        assert.equal(getComputedStyle(productGrid).getPropertyValue('--relewise-recommendation-grid-columns').trim(), '3');

        element.style.setProperty('--relewise-universal-search-width', '40rem');
        await new Promise(requestAnimationFrame);
        assert.equal(getComputedStyle(productGrid).getPropertyValue('--relewise-recommendation-grid-columns').trim(), '2');

        element.style.setProperty('--relewise-universal-search-width', '20rem');
        await new Promise(requestAnimationFrame);
        const narrowStyles = getComputedStyle(productGrid);
        assert.equal(narrowStyles.getPropertyValue('--relewise-recommendation-grid-columns').trim(), '1');
        assert.equal(narrowStyles.getPropertyValue('--relewise-recommendation-grid-mobile-columns').trim(), '1');
    });

    test('uses entity-specific compact columns for recommendation grids', async() => {
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
        const element = await fixture<UniversalSearch>(html`
            <relewise-universal-search
                open
                style="
                    --relewise-universal-search-width: 30rem;
                    --relewise-universal-search-mobile-product-columns: 1;
                    --relewise-universal-search-mobile-category-columns: 2;
                    --relewise-universal-search-mobile-content-columns: 3;
                ">
            </relewise-universal-search>
        `);
        await waitUntil(() => queryDeep(element, 'relewise-content-tile') !== null);

        const productGrid = queryDeep<HTMLElement>(element, 'relewise-popular-products')!;
        const categoryGrid = queryDeep<HTMLElement>(element, 'relewise-popular-product-categories')!;
        const contentGrid = queryDeep<HTMLElement>(element, 'relewise-popular-content')!;

        assert.equal(getComputedStyle(productGrid).getPropertyValue('--relewise-recommendation-grid-columns').trim(), '1');
        assert.equal(getComputedStyle(categoryGrid).getPropertyValue('--relewise-recommendation-grid-columns').trim(), '2');
        assert.equal(getComputedStyle(contentGrid).getPropertyValue('--relewise-recommendation-grid-columns').trim(), '3');
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

    test('mounts recommendations only while Universal Search is open and refreshes them when reopened', async() => {
        let requests = 0;
        let resolveInitial!: (value: unknown) => void;
        const initialResponse = new Promise(resolve => resolveInitial = resolve);
        Recommender.prototype.recommendPopularProducts = () => {
            requests++;
            return requests === 1
                ? initialResponse as never
                : Promise.resolve({ recommendations: [product('current')] }) as never;
        };
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            universalSearch: {
                recommendations: { initial: [{ type: 'PopularProducts' }] },
            },
        });

        const element = await fixture<UniversalSearch>(html`<relewise-universal-search></relewise-universal-search>`);
        await new Promise(resolve => setTimeout(resolve, 0));
        assert.equal(requests, 0);

        element.open();
        await waitUntil(() => requests === 1);
        element.close();
        await element.updateComplete;
        assert.isNull(queryDeep(element, 'relewise-popular-products'));

        resolveInitial({ recommendations: [product('stale')] });
        await initialResponse;
        await new Promise(resolve => setTimeout(resolve, 0));
        assert.isNull(queryDeep(element, 'relewise-product-tile'));

        element.open();
        await waitUntil(() => queryDeep<HTMLElement & { product: ProductResult }>(element, 'relewise-product-tile')?.product.productId === 'current');
        assert.equal(requests, 2);
    });

    test('requests no-result recommendations only for the active tab', async() => {
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

        (element as unknown as UniversalSearchTestApi).setSearchTerm('No matches');

        await waitUntil(() => popularProductRequests === 1);
        assert.equal(popularProductCategoryRequests, 0);
        assert.equal(popularContentRequests, 0);

        const tabs = [...element.renderRoot.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
        tabs[1].click();
        await waitUntil(() => popularProductCategoryRequests === 1);
        assert.equal(popularContentRequests, 0);

        tabs[2].click();
        await waitUntil(() => popularContentRequests === 1);

        tabs[0].click();
        await waitUntil(() => popularProductRequests === 2);
    });

    test('batches repeated recommendations for an active zero-result tab', async() => {
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {} },
                recommendations: {
                    noResults: {
                        products: [
                            { type: 'PopularProducts' },
                            { type: 'PersonalProducts' },
                        ],
                    },
                },
            },
        });
        const element = await fixture<UniversalSearch>(html`<relewise-universal-search open></relewise-universal-search>`);

        (element as unknown as UniversalSearchTestApi).setSearchTerm('No matches');

        await waitUntil(() => productBatchRequests === 1
            && queryAllDeep(element.renderRoot, 'relewise-product-tile').length === 2);
        assert.isTrue(requireDistinctProductsAcrossResults);
        assert.equal(popularProductRequests, 0);
        assert.equal(contentBatchRequests, 0);
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

    test('keeps the active-tab zero state when its fallback has results', async() => {
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
        assert.exists(queryAllDeep(productsTab.shadowRoot!, '[part="zero-results"]')[0]);
        assert.equal(
            queryAllDeep(productsTab.shadowRoot!, '[part="zero-results-title"]')[0]?.textContent?.trim(),
            'No products found.',
        );
        assert.equal(
            queryAllDeep(productsTab.shadowRoot!, '[part="zero-results-hint"]')[0]?.textContent?.trim(),
            'Try another search term or check the spelling.',
        );
    });

    (['shadow', 'light'] as const).forEach(domMode => {
        test(`keeps a shared price facet beside zero-result recommendations in ${domMode} DOM`, async() => {
            productFacets = {
                items: [{
                    $type: 'Relewise.Client.DataTypes.Search.Facets.Result.PriceRangeFacetResult, Relewise.Client',
                    field: 'SalesPrice',
                    priceSelectionStrategy: 'Product',
                    available: {
                        value: {
                            lowerBoundInclusive: 10,
                            upperBoundInclusive: 100,
                        },
                    },
                }],
            };
            updateUrlState(QueryKeys.term, 'No matches');
            updateUrlState(`${QueryKeys.productFacetLowerbound}SalesPrice`, '250');
            updateUrlState(`${QueryKeys.productFacetUpperbound}SalesPrice`, '500');
            const options = mockRelewiseOptions();
            options.components = { domMode };
            initializeRelewiseUI(options);
            useSearch({
                debounceTimeInMs: 0,
                facets: {
                    product(builder) {
                        builder.addFacet(
                            facet => facet.addSalesPriceRangeFacet('Product'),
                            { heading: 'Price' },
                        );
                    },
                },
                universalSearch: {
                    entities: { products: {} },
                    behavior: { zeroResultTabs: 'show' },
                    recommendations: { noResults: { products: [{ type: 'PopularProducts' }] } },
                },
            });
            const element = await fixture<UniversalSearch>(html`<relewise-universal-search open></relewise-universal-search>`);

            await waitUntil(() => queryDeep(element, 'relewise-product-tile') !== null
                && queryDeep(element, 'relewise-number-range-facet') !== null);
            const productsTab = element.renderRoot.querySelector<HTMLElement & { hideFacets: boolean }>('relewise-universal-search-products-tab')!;
            const tabRoot = productsTab.shadowRoot ?? productsTab;
            const recommendations = tabRoot.querySelector('relewise-universal-search-recommendations');
            const zeroResults = tabRoot.querySelector('[part="zero-results"]');

            assert.isFalse(productsTab.hideFacets);
            assert.isNotNull(zeroResults);
            assert.strictEqual(zeroResults!.nextElementSibling, recommendations);

            const rangeFacet = queryDeep(element, 'relewise-number-range-facet')!;
            const rangeFacetRoot = rangeFacet.shadowRoot ?? rangeFacet;
            const inputs = [...rangeFacetRoot.querySelectorAll<HTMLInputElement>('input')];
            assert.equal(inputs[0].value, '250');
            assert.equal(inputs[1].value, '500');
        });
    });

    test('keeps the active-tab zero state without facets when its fallback is empty', async() => {
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
        assert.isNull(queryAllDeep(productsTab.shadowRoot!, '[part="facets"]')[0] ?? null);
        assert.exists(queryAllDeep(productsTab.shadowRoot!, '[part="zero-results"]')[0]);
    });

    test('renders recovery recommendations when all zero-result tabs are hidden', async() => {
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {} },
                behavior: { zeroResultTabs: 'hide' },
                recommendations: { noResults: { whenAllTabsAreHidden: [{ type: 'SearchTermBasedProduct' }] } },
            },
        });
        const element = await fixture<UniversalSearch>(html`<relewise-universal-search open></relewise-universal-search>`);

        (element as unknown as UniversalSearchTestApi).setSearchTerm('Boots');

        await waitUntil(() => queryDeep(element, 'relewise-product-tile') !== null);
        assert.lengthOf(element.renderRoot.querySelectorAll('[role="tab"]'), 0);
        const zeroResults = element.renderRoot.querySelector<HTMLElement>('[part="zero-results"]')!;
        assert.isNull(element.renderRoot.querySelector('[part="results-summary"]'));
        assert.equal(zeroResults.getAttribute('role'), 'status');
        assert.equal(zeroResults.querySelector('[part="zero-results-title"]')?.textContent?.trim(), 'No results found for Boots.');
        assert.equal(zeroResults.querySelector('[part="zero-results-hint"]')?.textContent?.trim(), 'Try another search term or check the spelling.');
        assert.exists(zeroResults.querySelector('[part="zero-results-icon"] relewise-search-icon'));
        assert.equal(getComputedStyle(zeroResults.querySelector('strong')!).fontWeight, '700');
        assert.equal(getComputedStyle(zeroResults).backgroundColor, 'rgb(246, 246, 246)');
        assert.equal(getComputedStyle(zeroResults).marginBottom, '16px');
    });

    test('uses global no-result localization and allows the hint to be omitted', async() => {
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {} },
                behavior: { zeroResultTabs: 'hide' },
            },
            localization: {
                universalSearch: {
                    noResults: 'Ingen resultater fundet.',
                    noResultsHint: '',
                },
            },
        });
        const element = await fixture<UniversalSearch>(html`<relewise-universal-search open></relewise-universal-search>`);

        (element as unknown as UniversalSearchTestApi).setSearchTerm('Støvler');

        await waitUntil(() => element.renderRoot.querySelector('[part="zero-results"]') !== null);
        assert.equal(
            element.renderRoot.querySelector('[part="zero-results-title"]')?.textContent?.trim(),
            'Ingen resultater fundet.',
        );
        assert.isNull(element.renderRoot.querySelector('[part="zero-results-hint"]'));
    });

    test('forwards tab zero-result parts through Universal Search', async() => {
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {} },
                behavior: { zeroResultTabs: 'show' },
            },
        });

        const wrapper = await fixture<HTMLElement>(html`
            <div>
                <style>
                    relewise-universal-search {
                        --relewise-universal-search-zero-results-background: rgb(7, 8, 9);
                    }
                    relewise-universal-search::part(zero-results-title) {
                        color: rgb(1, 2, 3);
                    }
                    relewise-universal-search::part(zero-results-hint) {
                        color: rgb(4, 5, 6);
                    }
                </style>
                <relewise-universal-search open></relewise-universal-search>
            </div>
        `);
        const element = wrapper.querySelector<UniversalSearch>('relewise-universal-search')!;

        (element as unknown as UniversalSearchTestApi).setSearchTerm('No matches');

        await waitUntil(() => queryDeep(element, '[part="zero-results-hint"]') !== null);
        assert.equal(getComputedStyle(queryDeep(element, '[part="zero-results"]')!).backgroundColor, 'rgb(7, 8, 9)');
        assert.equal(getComputedStyle(queryDeep(element, '[part="zero-results-title"]')!).color, 'rgb(1, 2, 3)');
        assert.equal(getComputedStyle(queryDeep(element, '[part="zero-results-hint"]')!).color, 'rgb(4, 5, 6)');
    });

    test('batches multiple product recommendation children with deduplication', async() => {
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ universalSearch: {} });
        const states: RecommendationStateChangedEventDetail[] = [];
        const recommendations: UniversalSearchRecommendationBlock[] = [
            { type: 'PopularProducts' },
            { type: 'SearchTermBasedProduct' },
        ];

        const element = await fixture<UniversalSearchRecommendations>(html`
            <relewise-universal-search-recommendations
                .configuration=${recommendations}
                term="Boots"
                @relewise-ui-components:recommendation-state-changed=${(event: CustomEvent<RecommendationStateChangedEventDetail>) => states.push(event.detail)}>
            </relewise-universal-search-recommendations>
        `);

        await waitUntil(() => queryAllDeep(element.renderRoot, 'relewise-product-tile').length === 2);
        assert.isNull(element.renderRoot.querySelector('relewise-product-recommendation-batcher'));
        assert.equal(productBatchRequests, 1);
        assert.equal(popularProductRequests, 0);
        assert.deepEqual(searchTermRecommendationTerms, []);
        assert.deepEqual(batchedSearchTermRecommendationTerms, ['Boots']);
        assert.isTrue(requireDistinctProductsAcrossResults);
        assert.deepInclude(states, { loading: true, hasResults: false });
        assert.deepInclude(states, { loading: false, hasResults: true });
        assert.equal(Events.recommendationStateChanged, 'relewise-ui-components:recommendation-state-changed');
    });

    test('refreshes batched recommendation children when their term changes', async() => {
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ universalSearch: {} });

        const element = await fixture<UniversalSearchRecommendations>(html`
            <relewise-universal-search-recommendations
                .configuration=${[
                    { type: 'PopularProducts' as const },
                    { type: 'SearchTermBasedProduct' as const },
                ]}
                term="Boots">
            </relewise-universal-search-recommendations>
        `);
        await waitUntil(() => batchedSearchTermRecommendationTerms.includes('Boots'));

        element.term = 'Shoes';
        await element.updateComplete;
        await waitUntil(() => batchedSearchTermRecommendationTerms.includes('Shoes'));

        assert.deepEqual(batchedSearchTermRecommendationTerms, ['Boots', 'Shoes']);
        assert.equal(productBatchRequests, 2);
        assert.equal(popularProductRequests, 0);
    });

    test('aggregates loading and results across independent recommendation children', async() => {
        let resolveProducts!: (value: unknown) => void;
        let resolveContent!: (value: unknown) => void;
        Recommender.prototype.recommendPopularProducts = () => new Promise(resolve => resolveProducts = resolve) as never;
        Recommender.prototype.recommendPopularContents = () => new Promise(resolve => resolveContent = resolve) as never;
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ universalSearch: {} });
        const states: RecommendationStateChangedEventDetail[] = [];

        const element = await fixture<UniversalSearchRecommendations>(html`
            <relewise-universal-search-recommendations
                .configuration=${[
                    { type: 'PopularProducts' as const },
                    { type: 'PopularContents' as const },
                ]}
                @relewise-ui-components:recommendation-state-changed=${(event: CustomEvent<RecommendationStateChangedEventDetail>) => states.push(event.detail)}>
            </relewise-universal-search-recommendations>
        `);

        await waitUntil(() => Boolean(resolveProducts) && Boolean(resolveContent));
        resolveProducts({ recommendations: [product('available')] });
        await waitUntil(() => {
            const state = states[states.length - 1];
            return state?.loading && state.hasResults;
        });
        assert.isNull(element.renderRoot.querySelector('[part="recommendation-loading"]'));
        assert.isFalse(element.renderRoot.querySelector<HTMLElement>('[part~="popular-products"]')!.hidden);
        assert.isTrue(element.renderRoot.querySelector<HTMLElement>('[part~="popular-contents"]')!.hidden);

        resolveContent({ recommendations: [] });
        await waitUntil(() => {
            const state = states[states.length - 1];
            return !state?.loading && state.hasResults;
        });
        assert.lengthOf(queryAllDeep(element.renderRoot, 'relewise-product-tile'), 1);
        assert.lengthOf(queryAllDeep(element.renderRoot, 'relewise-content-tile'), 0);
        assert.equal(productBatchRequests, 0);
        assert.equal(contentBatchRequests, 0);
    });

    test('reports no results when all independent recommendation children are empty', async() => {
        Recommender.prototype.recommendPopularProducts = async() => ({ recommendations: [] }) as never;
        Recommender.prototype.recommendPopularContents = async() => ({ recommendations: [] }) as never;
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ universalSearch: {} });
        const states: RecommendationStateChangedEventDetail[] = [];

        const element = await fixture<UniversalSearchRecommendations>(html`
            <relewise-universal-search-recommendations
                .configuration=${[
                    { type: 'PopularProducts' as const },
                    { type: 'PopularContents' as const },
                ]}
                @relewise-ui-components:recommendation-state-changed=${(event: CustomEvent<RecommendationStateChangedEventDetail>) => states.push(event.detail)}>
            </relewise-universal-search-recommendations>
        `);

        await waitUntil(() => states.some(state => !state.loading && !state.hasResults));
        assert.isNull(element.renderRoot.querySelector('[part="recommendation-loading"]'));
        assert.lengthOf(queryAllDeep(element.renderRoot, 'relewise-product-tile, relewise-content-tile'), 0);
    });

    test('finishes without results when a standalone content recommendation request fails', async() => {
        Recommender.prototype.recommendPopularContents = async() => {
            throw new Error('Recommendations are unavailable');
        };
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ universalSearch: {} });
        const states: RecommendationStateChangedEventDetail[] = [];

        const element = await fixture<UniversalSearchRecommendations>(html`
            <relewise-universal-search-recommendations
                .configuration=${[{ type: 'PopularContents' as const }]}
                @relewise-ui-components:recommendation-state-changed=${(event: CustomEvent<RecommendationStateChangedEventDetail>) => states.push(event.detail)}>
            </relewise-universal-search-recommendations>
        `);

        await waitUntil(() => states.some(state => !state.loading && !state.hasResults));
        assert.isNull(element.renderRoot.querySelector('[part="recommendation-loading"]'));
        assert.lengthOf(queryAllDeep(element.renderRoot, 'relewise-content-tile'), 0);
    });

    test('finishes without results when batched product recommendation requests fail', async() => {
        Recommender.prototype.batchProductRecommendations = async function() {
            productBatchRequests++;
            throw new Error('Recommendations are unavailable');
        };
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ universalSearch: {} });
        const states: RecommendationStateChangedEventDetail[] = [];

        const element = await fixture<UniversalSearchRecommendations>(html`
            <relewise-universal-search-recommendations
                .configuration=${[
                    { type: 'PopularProducts' as const },
                    { type: 'SearchTermBasedProduct' as const },
                ]}
                term="Boots"
                @relewise-ui-components:recommendation-state-changed=${(event: CustomEvent<RecommendationStateChangedEventDetail>) => states.push(event.detail)}>
            </relewise-universal-search-recommendations>
        `);

        await waitUntil(() => states.some(state => !state.loading && !state.hasResults));
        assert.equal(productBatchRequests, 1);
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
                .configuration=${[
                    { type: 'PopularProducts' as const },
                    { type: 'SearchTermBasedProduct' as const },
                ]}
                term="Boots">
            </relewise-universal-search-recommendations>
        `);

        await waitUntil(() => element.querySelectorAll('relewise-product-tile').length === 2);
        assert.isNull(element.shadowRoot);
        assert.isNull(element.querySelector('relewise-product-recommendation-batcher'));
        assert.exists(element.querySelector('[part~="recommendation-block"]'));
        assert.equal(element.querySelector('relewise-product-tile')?.getAttribute('part'), 'product-tile');
        const registeredStyles = document.querySelector('#relewise-light-dom-styles');
        assert.equal(productBatchRequests, 1);
        assert.isTrue(requireDistinctProductsAcrossResults);
        assert.include(registeredStyles?.textContent, 'relewise-universal-search-recommendations .rw-recommendation-blocks');
        assert.include(registeredStyles?.textContent, 'relewise-popular-products');
    });
});
