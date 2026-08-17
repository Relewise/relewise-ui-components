import { assert, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import {
    PopularProductCategoriesRecommendationRequest,
    ProductCategoryResult,
    Recommender,
} from '@relewise/client';
import { initializeRelewiseUI, PopularProductCategories } from '../src';
import { Events } from '../src/helpers/events';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('relewise-popular-product-categories', () => {
    const originalRecommend = Recommender.prototype.recommendPopularProductCategories;
    let requests: PopularProductCategoriesRecommendationRequest[];

    setup(() => {
        requests = [];
        Recommender.prototype.recommendPopularProductCategories = async request => {
            requests.push(request);
            return {
                recommendations: [
                    { categoryId: 'first', displayName: 'First', rank: 1, data: {} } as ProductCategoryResult,
                    { categoryId: 'second', displayName: 'Second', rank: 2, data: {} } as ProductCategoryResult,
                ],
            };
        };
    });

    teardown(() => {
        Recommender.prototype.recommendPopularProductCategories = originalRecommend;
        fixtureCleanup();
        window.relewiseUIOptions = undefined!;
    });

    test('registers, requests, and renders product categories', async() => {
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const element = await fixture<PopularProductCategories>(html`
            <relewise-popular-product-categories
                displayed-at-location="test"
                number-of-recommendations="2"
                since-minutes-ago="60">
            </relewise-popular-product-categories>
        `);

        await waitUntil(() => requests.length === 1 && element.renderRoot.querySelectorAll('relewise-product-category-tile').length === 2);

        assert.instanceOf(element, PopularProductCategories);
        assert.equal(requests[0].settings.numberOfRecommendations, 2);
        assert.equal(requests[0].sinceMinutesAgo, 60);
        assert.equal(element.renderRoot.querySelectorAll('relewise-product-category-tile').length, 2);
    });

    test('refreshes recommendations when context changes', async() => {
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const element = await fixture<PopularProductCategories>(html`
            <relewise-popular-product-categories displayed-at-location="test"></relewise-popular-product-categories>
        `);
        await waitUntil(() => requests.length === 1);

        window.dispatchEvent(new CustomEvent(Events.contextSettingsUpdated));
        await waitUntil(() => requests.length === 2);

        assert.equal(element.renderRoot.querySelectorAll('relewise-product-category-tile').length, 2);
    });

    test('does not retain a context listener when disconnected during the initial request', async() => {
        let resolveInitial!: (response: { recommendations: ProductCategoryResult[] }) => void;
        const initialResponse = new Promise<{ recommendations: ProductCategoryResult[] }>(resolve => resolveInitial = resolve);
        Recommender.prototype.recommendPopularProductCategories = async request => {
            requests.push(request);
            return initialResponse;
        };
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const element = await fixture<PopularProductCategories>(html`
            <relewise-popular-product-categories displayed-at-location="test"></relewise-popular-product-categories>
        `);
        await waitUntil(() => requests.length === 1);

        element.remove();
        resolveInitial({ recommendations: [] });
        await initialResponse;
        window.dispatchEvent(new CustomEvent(Events.contextSettingsUpdated));
        await new Promise(resolve => setTimeout(resolve, 0));

        assert.lengthOf(requests, 1);
    });
});
