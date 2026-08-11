import { assert } from '@esm-bundle/chai';
import { Settings, UserFactory } from '@relewise/client';
import { buildPopularSearchTermsRequest, buildSearchTermPredictionRequest } from '../src/search/universalSearchInputAssistRequestBuilder';

const settings: Settings = {
    currency: 'currency',
    displayedAtLocation: 'Universal Search',
    language: 'language',
    user: UserFactory.anonymous(),
};

suite('universalSearchInputAssistRequestBuilder', () => {
    test('builds a popular search terms request', () => {
        const request = buildPopularSearchTermsRequest({
            settings,
            take: 5,
            tabs: ['products', 'content'],
        });

        assert.equal(request.settings?.numberOfRecommendations, 5);
        assert.deepEqual(request.settings?.targetEntityTypes, ['Product', 'Content']);
    });

    test('builds a search term prediction request', () => {
        const request = buildSearchTermPredictionRequest({
            settings,
            term: 'shoe',
            take: 7,
            tabs: ['products', 'productCategories', 'content'],
        });

        assert.equal(request.term, 'shoe');
        assert.equal(request.take, 7);
        assert.deepEqual(request.settings?.targetEntityTypes, ['Product', 'ProductCategory', 'Content']);
    });
});
