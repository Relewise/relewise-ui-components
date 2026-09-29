import { assert, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import { ProductRecommendationRequest, ProductRecommendationResponse, ProductResult, Recommender } from '@relewise/client';
import { PersonalProducts, PopularProducts, RecentlyViewedProducts, initializeRelewiseUI } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('relewise-popular-products', () => {
    const originalRecommendPopularProducts = Recommender.prototype.recommendPopularProducts;
    const originalRecommendPersonalProducts = Recommender.prototype.recommendPersonalProducts;
    const originalFetchRecentlyViewedProducts = RecentlyViewedProducts.prototype.fetchProducts;
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
        RecentlyViewedProducts.prototype.fetchProducts = originalFetchRecentlyViewedProducts;
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

    test('shares the optional heading with personal products', async() => {
        Recommender.prototype.recommendPersonalProducts = async() => ({
            recommendations: [{ displayName: 'Personal product', data: {} } as ProductResult],
        } as ProductRecommendationResponse);
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const root = await fixture<HTMLElement>(html`
            <div>
                <relewise-personal-products displayed-at-location="test">
                    <template slot="heading"><h3>For you</h3></template>
                </relewise-personal-products>
                <relewise-personal-products displayed-at-location="test"></relewise-personal-products>
            </div>
        `);
        const [withHeading, withoutHeading] = Array.from(root.querySelectorAll('relewise-personal-products')) as PersonalProducts[];
        await waitUntil(() => withHeading.renderRoot.querySelector('relewise-product-tile')
            && withoutHeading.renderRoot.querySelector('relewise-product-tile'));

        assert.exists(withHeading.renderRoot.querySelector('[part="heading"]'));
        assert.isFalse(withHeading.querySelector('h3[slot="heading"]')!.hasAttribute('hidden'));
        assert.notExists(withoutHeading.renderRoot.querySelector('[part="heading"]'));
        assert.isFalse(withoutHeading.hasAttribute('has-heading'));

        Recommender.prototype.recommendPersonalProducts = async() => ({ recommendations: [] } as ProductRecommendationResponse);
        await withHeading.fetchAndUpdateProducts();
        await withHeading.updateComplete;
        assert.notExists(withHeading.renderRoot.querySelector('[part="heading"]'));
        assert.equal(withHeading.getBoundingClientRect().height, 0);
    });

    test('supports headings on other product recommendations through the shared base', async() => {
        RecentlyViewedProducts.prototype.fetchProducts = async() => ({
            recommendations: [{ displayName: 'Recently viewed product', data: {} } as ProductResult],
        } as ProductRecommendationResponse);
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const el = await fixture<RecentlyViewedProducts>(html`
            <relewise-recently-viewed-products displayed-at-location="test">
                <template slot="heading"><p>Recently viewed</p></template>
            </relewise-recently-viewed-products>
        `);
        await waitUntil(() => el.renderRoot.querySelector('relewise-product-tile'));

        assert.exists(el.renderRoot.querySelector('[part="heading"]'));
        assert.isAbove(el.querySelector('p[slot="heading"]')!.getClientRects().length, 0);
    });

    test('renders a heading when batched recommendations arrive', async() => {
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const el = document.createElement('relewise-popular-products');
        el.displayedAtLocation = 'test';
        el.providedData = { requests: [] };
        const template = document.createElement('template');
        template.slot = 'heading';
        template.innerHTML = '<h2>Popular products</h2>';
        el.append(template);
        const loadingStates: boolean[] = [];
        el.addEventListener('relewise-ui-components:recommendation-state-changed', event => {
            loadingStates.push(event.detail.loading);
        });
        await fixture(el);
        assert.isTrue(loadingStates[loadingStates.length - 1]);
        assert.notExists(el.renderRoot.querySelector('[part="heading"]'));

        el.providedData = {
            requests: [{
                id: el,
                request: {} as ProductRecommendationRequest,
                result: { recommendations: [{ displayName: 'First product', data: {} } as ProductResult] } as ProductRecommendationResponse,
            }],
        };
        await el.updateComplete;

        assert.isFalse(loadingStates[loadingStates.length - 1]);
        assert.exists(el.renderRoot.querySelector('[part="heading"]'));
        assert.isAbove(el.querySelector('h2[slot="heading"]')!.getClientRects().length, 0);

        await el.fetchAndUpdateProducts();
        await el.updateComplete;
        assert.isTrue(loadingStates[loadingStates.length - 1]);
        assert.notExists(el.renderRoot.querySelector('[part="heading"]'));

        el.providedData = {
            requests: [{
                id: el,
                request: {} as ProductRecommendationRequest,
                result: { recommendations: [] } as ProductRecommendationResponse,
            }],
        };
        await el.updateComplete;
        assert.isFalse(loadingStates[loadingStates.length - 1]);
        assert.notExists(el.renderRoot.querySelector('[part="heading"]'));
    });

    for (const domMode of ['shadow', 'light'] as const) {
        test(`adds no heading or grid space without a slot in ${domMode} DOM`, async() => {
            Recommender.prototype.recommendPopularProducts = async() => ({
                recommendations: [{ displayName: 'First product', data: {} } as ProductResult],
            } as ProductRecommendationResponse);

            const options = mockRelewiseOptions();
            options.components = { domMode };
            initializeRelewiseUI(options).useRecommendations();

            const el = await fixture<PopularProducts>(html`
                <relewise-popular-products displayed-at-location="test"></relewise-popular-products>
            `);
            await waitUntil(() => el.renderRoot.querySelectorAll('relewise-product-tile').length === 1);

            assert.notExists(el.renderRoot.querySelector('[part="heading"]'));
            assert.isFalse(el.hasAttribute('has-heading'));
            assert.equal(el.renderRoot.firstElementChild?.localName, 'relewise-product-tile');

            const template = document.createElement('template');
            template.slot = 'heading';
            template.innerHTML = '<h2>Now with a heading</h2>';
            el.append(template);
            await el.fetchAndUpdateProducts();
            await el.updateComplete;
            assert.exists(el.renderRoot.querySelector('[part="heading"]'));
            assert.isTrue(el.hasAttribute('has-heading'));
            const heading = el.querySelector<HTMLElement>('h2[slot="heading"]')!;
            assert.isAbove(heading.getClientRects().length, 0);

            const replacement = document.createElement('template');
            replacement.slot = 'heading';
            replacement.innerHTML = '<p>Updated heading</p>';
            template.replaceWith(replacement);
            await el.fetchAndUpdateProducts();
            await el.updateComplete;
            assert.notExists(el.querySelector('h2[slot="heading"]'));
            assert.isAbove(el.querySelector('p[slot="heading"]')!.getClientRects().length, 0);

            replacement.remove();
            await el.fetchAndUpdateProducts();
            await el.updateComplete;
            assert.notExists(el.renderRoot.querySelector('[part="heading"]'));
            assert.isFalse(el.hasAttribute('has-heading'));
            assert.equal(el.renderRoot.firstElementChild?.localName, 'relewise-product-tile');
        });

        test(`shows the heading only after a non-empty request completes in ${domMode} DOM`, async() => {
            const pendingResponses: Array<(response: ProductRecommendationResponse) => void> = [];
            Recommender.prototype.recommendPopularProducts = () => new Promise<ProductRecommendationResponse>(resolve => {
                pendingResponses.push(resolve);
            });

            const options = mockRelewiseOptions();
            options.components = { domMode };
            initializeRelewiseUI(options).useRecommendations();

            const fixtureRoot = await fixture<HTMLElement>(html`
                <div>
                    <style>.slot-heading { display: block !important; }</style>
                    <relewise-popular-products displayed-at-location="test">
                        <template slot="heading"><h3 class="slot-heading">Popular products</h3></template>
                    </relewise-popular-products>
                </div>
            `);
            const el = fixtureRoot.querySelector('relewise-popular-products') as PopularProducts;
            const template = el.querySelector<HTMLTemplateElement>('template[slot="heading"]')!;

            await waitUntil(() => pendingResponses.length === 1, 'recommendPopularProducts was never called');
            assert.equal(template.getClientRects().length, 0);
            assert.notExists(el.querySelector('h3[slot="heading"]'));
            assert.notExists(el.renderRoot.querySelector('[part="heading"]'));

            const recommendations = [{ displayName: 'First product', data: {} } as ProductResult];
            pendingResponses[0]({ recommendations } as ProductRecommendationResponse);

            await waitUntil(() => el.renderRoot.querySelector('[part="heading"]')
                && el.querySelector<HTMLElement>('h3[slot="heading"]')?.getClientRects().length,
            'Heading was not shown with products');

            const heading = el.querySelector<HTMLElement>('h3[slot="heading"]')!;
            const container = el.renderRoot.querySelector<HTMLElement>('[part="heading"]')!;
            assert.equal(heading.style.display, '');
            assert.equal(getComputedStyle(heading).display, 'block');
            assert.isAbove(heading.getClientRects().length, 0);
            if (domMode === 'shadow') {
                const slot = container.querySelector<HTMLSlotElement>('slot[name="heading"]')!;
                assert.include(slot.assignedElements(), heading);
            } else {
                assert.equal(heading.parentElement, container);
            }

            const sameProductsRequest = el.fetchAndUpdateProducts();
            await waitUntil(() => pendingResponses.length === 2, 'second recommendation request was never called');
            await el.updateComplete;
            assert.notExists(el.renderRoot.querySelector('[part="heading"]'));
            assert.equal(heading.getClientRects().length, 0);
            assert.equal(el.renderRoot.querySelectorAll('relewise-product-tile').length, 1);

            pendingResponses[1]({ recommendations } as ProductRecommendationResponse);
            await sameProductsRequest;
            await el.updateComplete;
            assert.exists(el.renderRoot.querySelector('[part="heading"]'));

            const emptyRequest = el.fetchAndUpdateProducts();
            await waitUntil(() => pendingResponses.length === 3, 'third recommendation request was never called');
            await el.updateComplete;
            assert.notExists(el.renderRoot.querySelector('[part="heading"]'));

            pendingResponses[2]({ recommendations: [] } as ProductRecommendationResponse);
            await emptyRequest;
            await el.updateComplete;
            assert.notExists(el.renderRoot.querySelector('[part="heading"]'));
            assert.equal(heading.getClientRects().length, 0);
            assert.equal(el.renderRoot.querySelectorAll('relewise-product-tile').length, 0);
            assert.equal(el.getBoundingClientRect().height, 0);
            assert.equal(el.querySelector('template[slot="heading"]'), template);
            if (domMode === 'shadow') {
                assert.equal(el.querySelector('h3[slot="heading"]'), heading);
            }

            heading.style.display = 'flex';
            const nextRequest = el.fetchAndUpdateProducts();
            await waitUntil(() => pendingResponses.length === 4, 'fourth recommendation request was never called');
            await el.updateComplete;
            assert.notExists(el.renderRoot.querySelector('[part="heading"]'));
            pendingResponses[3]({
                recommendations: [{ displayName: 'Second product', data: {} } as ProductResult],
            } as ProductRecommendationResponse);
            await nextRequest;
            await el.updateComplete;
            assert.exists(el.renderRoot.querySelector('[part="heading"]'));
            assert.equal(heading.style.display, 'flex');
            assert.isAbove(heading.getClientRects().length, 0);
        });
    }
});
