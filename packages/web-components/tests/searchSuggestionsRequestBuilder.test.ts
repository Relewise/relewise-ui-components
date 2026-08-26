import { assert } from '@esm-bundle/chai';
import { Settings, UserFactory } from '@relewise/client';
import { buildPopularSearchTermsRequest, buildSearchTermPredictionRequest } from '../src/builders/searchSuggestionsRequestBuilder';

const settings: Settings = {
    currency: 'currency',
    displayedAtLocation: 'Universal Search',
    language: 'language',
    user: UserFactory.anonymous(),
};

suite('searchSuggestionsRequestBuilder', () => {
    test('builds a popular search terms request', () => {
        const request = buildPopularSearchTermsRequest({
            settings,
            take: 5,
            targetEntityTypes: ['Product', 'Content'],
        });

        assert.equal(request.settings?.numberOfRecommendations, 5);
        assert.deepEqual(request.settings?.targetEntityTypes, ['Product', 'Content']);
    });

    test('builds a search term prediction request', () => {
        const request = buildSearchTermPredictionRequest({
            settings,
            term: 'shoe',
            take: 7,
            targetEntityTypes: ['Product', 'ProductCategory', 'Content'],
        });

        assert.equal(request.term, 'shoe');
        assert.equal(request.take, 7);
        assert.deepEqual(request.settings?.targetEntityTypes, ['Product', 'ProductCategory', 'Content']);
    });
});
