import { assert, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import { ProductRecommendationResponse, ProductResult, Recommender } from '@relewise/client';
import { initializeRelewiseUI, PurchasedWithMultipleProducts } from '../src';
import { clearRegisteredLightDomStylesForTesting } from '../src/lightDomStyles';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('relewise-purchased-with-multiple-products', () => {
    const originalRecommend = Recommender.prototype.recommendPurchasedWithMultipleProducts;

    teardown(() => {
        Recommender.prototype.recommendPurchasedWithMultipleProducts = originalRecommend;
        fixtureCleanup();
        clearRegisteredLightDomStylesForTesting();
        window.relewiseUIOptions = undefined!;
    });

    test('request input elements do not occupy Light DOM grid cells', async() => {
        Recommender.prototype.recommendPurchasedWithMultipleProducts = async() => ({
            recommendations: [
                { productId: 'first', data: {} } as ProductResult,
                { productId: 'second', data: {} } as ProductResult,
            ],
        } as ProductRecommendationResponse);
        const options = mockRelewiseOptions();
        options.components = { domMode: 'light' };
        initializeRelewiseUI(options).useRecommendations();

        const element = await fixture<PurchasedWithMultipleProducts>(html`
            <relewise-purchased-with-multiple-products displayed-at-location="test">
                <product-and-variant-id product-id="first"></product-and-variant-id>
                <product-and-variant-id product-id="second"></product-and-variant-id>
            </relewise-purchased-with-multiple-products>
        `);
        await waitUntil(() => element.querySelectorAll('relewise-product-tile').length === 2);

        element.querySelectorAll('product-and-variant-id').forEach(input => {
            assert.equal(getComputedStyle(input).display, 'none');
        });
        assert.isNull(element.querySelector('.rw-recommendation-grid'));
        assert.closeTo(
            element.querySelector('relewise-product-tile')!.getBoundingClientRect().left,
            element.getBoundingClientRect().left,
            1,
        );
    });
});
