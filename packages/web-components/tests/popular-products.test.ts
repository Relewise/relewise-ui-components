import { assert, fixture, html, waitUntil } from '@open-wc/testing';
import { PopularProducts, initializeRelewiseUI } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';
import { integrationTestRelewiseSettings } from './util/testRelewiseUISettings';

suite('relewise-popular-products', () => {
    test('is not intance of when relewise not instantiated', async() => {
        const el = await fixture(html`<relewise-popular-products></relewise-popular-products>`);
        assert.notInstanceOf(el, PopularProducts)
    });
    
    test('is intance of when relewise is instantiated', async() => {
        initializeRelewiseUI(mockRelewiseOptions());
        const el = await fixture(html`<relewise-popular-products></relewise-popular-products>`);
        assert.instanceOf(el, PopularProducts);
    });

    test('renders nothing when wrongly configured', async() => {
        initializeRelewiseUI(mockRelewiseOptions());
        const el = await fixture(html`<relewise-popular-products></relewise-popular-products>`) as PopularProducts;
        await el.updateComplete;
        assert.shadowDom.equal(el, '');
    });

    test('renders numberOfRecommendations', async() => {
        const numberOfRecommendations = 10;

        initializeRelewiseUI(integrationTestRelewiseSettings());
        const el = await fixture(html`<relewise-popular-products numberOfRecommendations=${numberOfRecommendations}></relewise-popular-products>`) as PopularProducts;
        
        await waitUntil(
            () => { return el.shadowRoot!.querySelectorAll('relewise-product-tile').length === numberOfRecommendations },
            'Never rendered any products', { timeout: 5000 },
        );

        assert.equal(el.shadowRoot!.querySelectorAll('relewise-product-tile').length, numberOfRecommendations)
    });
})
