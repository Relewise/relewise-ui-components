import { assert, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import { ProductRecommendationRequest, ProductRecommendationResponse, ProductResult, Recommender } from '@relewise/client';
import { PopularProducts, initializeRelewiseUI } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('relewise-popular-products', () => {
    const originalRecommendPopularProducts = Recommender.prototype.recommendPopularProducts;
    let recommendPopularProductsCalls: ProductRecommendationRequest[];

    setup(() => {
        recommendPopularProductsCalls = [];
        Recommender.prototype.recommendPopularProducts = async (request: ProductRecommendationRequest) => {
            recommendPopularProductsCalls.push(request);
            return undefined;
        };
    });

    teardown(() => {
        Recommender.prototype.recommendPopularProducts = originalRecommendPopularProducts;
        fixtureCleanup();
        window.relewiseUIOptions = undefined!;
    });

    test('is not instance of when relewise not instantiated', async() => {
        const el = await fixture(html`<relewise-popular-products></relewise-popular-products>`);
        assert.notInstanceOf(el, PopularProducts);
    });
    
    test('is instance of when relewise is instantiated', async() => {
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const el = await fixture(html`<relewise-popular-products></relewise-popular-products>`);
        assert.instanceOf(el, PopularProducts);
    });

    test('renders nothing when wrongly configured', async() => {
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const el = await fixture(html`<relewise-popular-products></relewise-popular-products>`) as PopularProducts;
        await el.updateComplete;
        assert.shadowDom.equal(el, '');
    });

    test('renders nothing when useRecommendations is never called', async() => {
        const numberOfRecommendations = 10;

        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const el = await fixture(html`<relewise-popular-products number-of-recommendations=${numberOfRecommendations}></relewise-popular-products>`) as PopularProducts;
        
        await el.updateComplete;
        assert.shadowDom.equal(el, '');
    });

    test('renders numberOfRecommendations', async() => {
        const numberOfRecommendations = 3;
        const recommendations: ProductResult[] = [
            {
                productId: 'product-1',
                displayName: 'First product',
                data: {},
            } as ProductResult,
            {
                productId: 'product-2',
                displayName: 'Second product',
                data: {},
            } as ProductResult,
            {
                productId: 'product-3',
                displayName: 'Third product',
                data: {},
            } as ProductResult,
        ];

        Recommender.prototype.recommendPopularProducts = async (request: ProductRecommendationRequest) => {
            recommendPopularProductsCalls.push(request);
            return {
                recommendations: recommendations.slice(0, request.settings.numberOfRecommendations),
            } as ProductRecommendationResponse;
        };

        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const el = await fixture(html`<relewise-popular-products number-of-recommendations=${numberOfRecommendations}></relewise-popular-products>`) as PopularProducts;

        await waitUntil(() => recommendPopularProductsCalls.length > 0, 'recommendPopularProducts was never called', { timeout: 2000 });
        assert.equal(recommendPopularProductsCalls[0].settings.numberOfRecommendations, numberOfRecommendations);
        
        await waitUntil(
            () => { return el.shadowRoot!.querySelectorAll('relewise-product-tile').length === numberOfRecommendations; },
            'Never rendered any products', { timeout: 5000 },
        );

        assert.equal(el.shadowRoot!.querySelectorAll('relewise-product-tile').length, numberOfRecommendations);
    });
});
