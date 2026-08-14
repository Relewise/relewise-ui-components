import { assert } from '@esm-bundle/chai';
import { Settings, UserFactory } from '@relewise/client';
import { buildSearchTermPredictionRequest } from '../src/search/searchSuggestionsRequestBuilder';

const settings: Settings = {
    currency: 'currency',
    displayedAtLocation: 'Universal Search',
    language: 'language',
    user: UserFactory.anonymous(),
};

suite('searchSuggestionsRequestBuilder', () => {
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
