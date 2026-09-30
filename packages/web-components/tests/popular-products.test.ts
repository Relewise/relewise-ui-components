import { assert, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import { ProductRecommendationRequest, ProductRecommendationResponse, ProductResult, Recommender } from '@relewise/client';
import { PersonalProducts, PopularProducts, initializeRelewiseUI } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('relewise-popular-products', () => {
    const originalRecommendPopularProducts = Recommender.prototype.recommendPopularProducts;
    const originalRecommendPersonalProducts = Recommender.prototype.recommendPersonalProducts;
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
        Recommender.prototype.recommendPersonalProducts = originalRecommendPersonalProducts;
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
    });

    test('shows the slot with products and removes it for an empty result', async() => {
        const pending: Array<(response: ProductRecommendationResponse) => void> = [];
        Recommender.prototype.recommendPopularProducts = () => new Promise<ProductRecommendationResponse>(resolve => {
            pending.push(resolve);
        });
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();

        const el = await fixture<PopularProducts>(html`
            <relewise-popular-products displayed-at-location="test">
                <template slot="result-heading"><h2>Popular products</h2></template>
            </relewise-popular-products>
        `);
        await waitUntil(() => pending.length === 1);
        assert.notExists(el.shadowRoot!.querySelector('slot[name="result-heading"]'));
        assert.notExists(el.querySelector('h2'));

        pending[0]({ recommendations: [{ displayName: 'Product', data: {} } as ProductResult] } as ProductRecommendationResponse);
        await waitUntil(() => el.querySelector('h2'));
        const heading = el.querySelector('h2')!;
        const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="result-heading"]')!;
        assert.include(slot.assignedElements(), heading);
        assert.isAbove(heading.getClientRects().length, 0);
        const firstTile = el.shadowRoot!.querySelector<HTMLElement>('relewise-product-tile')!;
        firstTile.style.minHeight = '600px';
        assert.isBelow(heading.getBoundingClientRect().height, 100);
        assert.isBelow(firstTile.getBoundingClientRect().top - heading.getBoundingClientRect().bottom, 100);

        const nextRequest = el.fetchAndUpdateProducts();
        await waitUntil(() => pending.length === 2);
        assert.exists(el.shadowRoot!.querySelector('slot[name="result-heading"]'));

        pending[1]({ recommendations: [] } as ProductRecommendationResponse);
        await nextRequest;
        await el.updateComplete;
        assert.notExists(el.shadowRoot!.querySelector('slot[name="result-heading"]'));
        assert.equal(heading.getClientRects().length, 0);
        assert.equal(el.getBoundingClientRect().height, 0);
    });

    test('reserves no heading row when the slot is absent or empty', async() => {
        Recommender.prototype.recommendPopularProducts = async() => ({
            recommendations: [{ displayName: 'Product', data: {} } as ProductResult],
        } as ProductRecommendationResponse);
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();

        const root = await fixture<HTMLElement>(html`
            <div>
                <relewise-popular-products displayed-at-location="test"></relewise-popular-products>
                <relewise-popular-products displayed-at-location="test">
                    <template slot="result-heading"><h2></h2></template>
                </relewise-popular-products>
            </div>
        `);
        const [withoutHeading, emptyHeading] = Array.from(root.querySelectorAll('relewise-popular-products')) as PopularProducts[];
        await waitUntil(() => withoutHeading.shadowRoot!.querySelector('relewise-product-tile')
            && emptyHeading.querySelector('h2'));

        for (const el of [withoutHeading, emptyHeading]) {
            const tile = el.shadowRoot!.querySelector('relewise-product-tile')!;
            assert.equal(tile.getBoundingClientRect().top, el.getBoundingClientRect().top);
        }
        assert.equal(emptyHeading.querySelector('h2')!.getClientRects().length, 0);
    });

    test('shares the slot with personal products', async() => {
        Recommender.prototype.recommendPersonalProducts = async() => ({
            recommendations: [{ displayName: 'Personal product', data: {} } as ProductResult],
        } as ProductRecommendationResponse);
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();

        const el = await fixture<PersonalProducts>(html`
            <relewise-personal-products displayed-at-location="test">
                <template slot="result-heading"><p>For you</p></template>
            </relewise-personal-products>
        `);
        await waitUntil(() => el.querySelector('p'));

        assert.include(el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="result-heading"]')!.assignedElements(), el.querySelector('p'));
    });

    test('shows the slot when batched results arrive', async() => {
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const el = document.createElement('relewise-popular-products');
        el.displayedAtLocation = 'test';
        el.providedData = { requests: [] };
        el.innerHTML = '<template slot="result-heading"><h2>Popular products</h2></template>';
        await fixture(el);
        assert.notExists(el.shadowRoot!.querySelector('slot[name="result-heading"]'));

        el.providedData = {
            requests: [{
                id: el,
                request: {} as ProductRecommendationRequest,
                result: { recommendations: [{ displayName: 'Product', data: {} } as ProductResult] } as ProductRecommendationResponse,
            }],
        };
        await el.updateComplete;
        await waitUntil(() => el.querySelector('h2'));

        assert.exists(el.shadowRoot!.querySelector('slot[name="result-heading"]'));
    });
});
