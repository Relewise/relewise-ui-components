import { assert, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import { ProductResult, Recommender, SearchTermBasedProductRecommendationRequest } from '@relewise/client';
import { initializeRelewiseUI, SearchTermBasedProducts } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('relewise-search-term-based-products', () => {
    const originalRecommend = Recommender.prototype.recommendSearchTermBasedProducts;
    let requests: SearchTermBasedProductRecommendationRequest[];

    setup(() => {
        requests = [];
        Recommender.prototype.recommendSearchTermBasedProducts = async request => {
            requests.push(request);
            return {
                recommendations: [{ productId: 'product', displayName: 'Product', rank: 1, data: {} } as ProductResult],
            };
        };
    });

    teardown(() => {
        Recommender.prototype.recommendSearchTermBasedProducts = originalRecommend;
        fixtureCleanup();
        window.relewiseUIOptions = undefined!;
    });

    test('does not request recommendations without a term', async() => {
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const element = await fixture<SearchTermBasedProducts>(html`
            <relewise-search-term-based-products displayed-at-location="test"></relewise-search-term-based-products>
        `);
        await new Promise(resolve => setTimeout(resolve, 0));

        assert.lengthOf(requests, 0);
        assert.isNull(element.renderRoot.querySelector('relewise-product-tile'));
    });

    test('requests and renders products for the configured term', async() => {
        const calls: string[] = [];
        const options = mockRelewiseOptions();
        options.selectedPropertiesSettings = {
            product: { displayName: false, dataKeys: ['ProductData'] },
            variant: { displayName: false, dataKeys: ['VariantData'] },
        };
        options.filters = { product: () => calls.push('global filter') };
        options.relevanceModifiers = { product: () => calls.push('global relevance') };
        options.targets = {
            recommendationTargets: configurations => configurations.add({
                target: 'products target',
                configuration: {
                    filters: () => calls.push('target filter'),
                    relevanceModifiers: () => calls.push('target relevance'),
                },
            }),
        };
        initializeRelewiseUI(options).useRecommendations();
        const element = await fixture<SearchTermBasedProducts>(html`
            <relewise-search-term-based-products
                displayed-at-location="test"
                term="shoes"
                target="products target"
                number-of-recommendations="3">
            </relewise-search-term-based-products>
        `);

        await waitUntil(() => requests.length === 1 && element.renderRoot.querySelector('relewise-product-tile') !== null);

        assert.equal(requests[0].term, 'shoes');
        assert.equal(requests[0].settings.numberOfRecommendations, 3);
        assert.deepEqual(requests[0].settings.selectedProductProperties!.dataKeys, ['ProductData']);
        assert.deepEqual(requests[0].settings.selectedVariantProperties!.dataKeys, ['VariantData']);
        assert.deepEqual(calls, ['global relevance', 'global filter', 'target filter', 'target relevance']);
    });
});
