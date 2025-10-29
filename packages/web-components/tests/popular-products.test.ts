import { assert, fixture, html, waitUntil } from '@open-wc/testing';
import { PopularProducts, initializeRelewiseUI } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';
import { integrationTestRelewiseOptions } from './util/testRelewiseUIOptions';

suite('relewise-popular-products', () => {
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

        initializeRelewiseUI(integrationTestRelewiseOptions()).useRecommendations();
        const el = await fixture(html`<relewise-popular-products number-of-recommendations=${numberOfRecommendations}></relewise-popular-products>`) as PopularProducts;
        
        await el.updateComplete;
        assert.shadowDom.equal(el, '');
    });

    test('renders numberOfRecommendations', async() => {
        const numberOfRecommendations = 3;

        initializeRelewiseUI(integrationTestRelewiseOptions()).useRecommendations();
        const el = await fixture(html`<relewise-popular-products number-of-recommendations=${numberOfRecommendations}></relewise-popular-products>`) as PopularProducts;
        
        await waitUntil(
            () => { return el.shadowRoot!.querySelectorAll('relewise-product-tile').length === numberOfRecommendations; },
            'Never rendered any products', { timeout: 5000 },
        );

        assert.equal(el.shadowRoot!.querySelectorAll('relewise-product-tile').length, numberOfRecommendations);
    });
});
