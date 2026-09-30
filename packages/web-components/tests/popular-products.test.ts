import { assert, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import { ProductRecommendationRequest, ProductRecommendationResponse, ProductResult, Recommender } from '@relewise/client';
import { PopularProducts, initializeRelewiseUI } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('relewise-popular-products', () => {
    const originalRecommendPopularProducts = Recommender.prototype.recommendPopularProducts;
    let recommendPopularProductsCalls: ProductRecommendationRequest[];

    setup(() => {
        recommendPopularProductsCalls = [];
        Recommender.prototype.recommendPopularProducts = async(request: ProductRecommendationRequest) => {
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
                displayName: 'First product',
                data: {},
            } as ProductResult,
            {
                displayName: 'Second product',
                data: {},
            } as ProductResult,
            {
                displayName: 'Third product',
                data: {},
            } as ProductResult,
        ];

        Recommender.prototype.recommendPopularProducts = async(request: ProductRecommendationRequest) => {
            recommendPopularProductsCalls.push(request);
            return {
                recommendations: recommendations.slice(0, request.settings.numberOfRecommendations),
            } as ProductRecommendationResponse;
        };

        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const el = await fixture(html`<relewise-popular-products number-of-recommendations=${numberOfRecommendations}></relewise-popular-products>`) as PopularProducts;

        await waitUntil(() => recommendPopularProductsCalls.length > 0, 'recommendPopularProducts was never called', { timeout: 2000 });

        const request = recommendPopularProductsCalls[0];
        assert.equal(request.settings.numberOfRecommendations, numberOfRecommendations);
        
        await waitUntil(
            () => { return el.shadowRoot!.querySelectorAll('relewise-product-tile').length === numberOfRecommendations; },
            'Never rendered any products', { timeout: 2000 },
        );

        assert.equal(el.shadowRoot!.querySelectorAll('relewise-product-tile').length, numberOfRecommendations);
        assert.notExists(el.shadowRoot!.querySelector('[part~="recommendation-grid"]'));
    });

    test('renders slotted content before an exposed product grid in Shadow DOM', async() => {
        Recommender.prototype.recommendPopularProducts = async() => ({
            recommendations: [{ productId: 'product-1', data: {} } as ProductResult],
        } as ProductRecommendationResponse);
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const el = await fixture<PopularProducts>(html`
            <relewise-popular-products displayed-at-location="test">
                <h2 slot="before-results">Recommended for you</h2>
            </relewise-popular-products>
        `);

        await waitUntil(() => el.shadowRoot!.querySelector('[part~="recommendation-grid"]') !== null);

        const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="before-results"]')!;
        const grid = el.shadowRoot!.querySelector<HTMLElement>('[part~="recommendation-grid"]')!;
        assert.equal(slot.assignedElements()[0]?.textContent, 'Recommended for you');
        assert.isTrue(grid.part.contains('product-recommendation-grid'));
        assert.exists(el.shadowRoot!.querySelector('.rw-recommendation-layout'));
    });

    test('renders slotted content and the product grid in Light DOM', async() => {
        let resolveRecommendations!: (response: ProductRecommendationResponse) => void;
        Recommender.prototype.recommendPopularProducts = () => new Promise(resolve => resolveRecommendations = resolve);
        const options = mockRelewiseOptions();
        options.components = { domMode: 'light' };
        initializeRelewiseUI(options).useRecommendations();
        const el = await fixture<PopularProducts>(html`
            <relewise-popular-products displayed-at-location="test">
                <h2 slot="before-results">Recommended for you</h2>
            </relewise-popular-products>
        `);
        const beforeResults = el.querySelector<HTMLElement>('[slot="before-results"]')!;

        await waitUntil(() => resolveRecommendations !== undefined);
        assert.equal(getComputedStyle(beforeResults).display, 'none');

        resolveRecommendations({
            recommendations: [{ productId: 'product-1', data: {} } as ProductResult],
        } as ProductRecommendationResponse);
        await waitUntil(() => el.querySelector('[part~="recommendation-grid"]') !== null);

        assert.equal(el.renderRoot, el);
        assert.equal(getComputedStyle(el).gridAutoRows, 'auto');
        assert.notEqual(getComputedStyle(beforeResults).display, 'none');
        assert.exists(el.querySelector('.rw-recommendation-layout'));
        assert.exists(el.querySelector('.rw-product-recommendation-grid'));
    });
});
