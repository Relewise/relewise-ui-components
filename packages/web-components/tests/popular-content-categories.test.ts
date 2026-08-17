import { assert, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import {
    PopularContentCategoriesRecommendationRequest,
    ContentCategoryResult,
    Recommender,
} from '@relewise/client';
import { initializeRelewiseUI, PopularContentCategories } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('relewise-popular-content-categories', () => {
    const originalRecommend = Recommender.prototype.recommendPopularContentCategories;
    let requests: PopularContentCategoriesRecommendationRequest[];

    setup(() => {
        requests = [];
        Recommender.prototype.recommendPopularContentCategories = async request => {
            requests.push(request);
            return {
                recommendations: [
                    { categoryId: 'first', displayName: 'First', rank: 1, data: {} } as ContentCategoryResult,
                    { categoryId: 'second', displayName: 'Second', rank: 2, data: {} } as ContentCategoryResult,
                ],
            };
        };
    });

    teardown(() => {
        Recommender.prototype.recommendPopularContentCategories = originalRecommend;
        fixtureCleanup();
        window.relewiseUIOptions = undefined!;
    });

    test('registers, requests, and renders content categories', async() => {
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const element = await fixture<PopularContentCategories>(html`
            <relewise-popular-content-categories
                displayed-at-location="test"
                number-of-recommendations="2"
                since-minutes-ago="60">
            </relewise-popular-content-categories>
        `);

        await waitUntil(() => requests.length === 1 && element.renderRoot.querySelectorAll('relewise-content-category-tile').length === 2);

        assert.instanceOf(element, PopularContentCategories);
        assert.equal(requests[0].settings.numberOfRecommendations, 2);
        assert.equal(requests[0].sinceMinutesAgo, 60);
        assert.equal(element.renderRoot.querySelectorAll('relewise-content-category-tile').length, 2);
    });
});
