import { assert } from '@esm-bundle/chai';
import { Settings, UserFactory } from '@relewise/client';
import { buildPopularSearchTermsRequest } from '../src/recommendations/popularSearchTermsRequestBuilder';

const settings: Settings = {
    currency: 'currency',
    displayedAtLocation: 'Recommendation blocks',
    language: 'language',
    user: UserFactory.anonymous(),
};

suite('popularSearchTermsRequestBuilder', () => {
    test('builds a popular search terms request', () => {
        const request = buildPopularSearchTermsRequest({
            settings,
            take: 5,
            targetEntityTypes: ['Product', 'Content'],
        });

        assert.equal(request.settings?.numberOfRecommendations, 5);
        assert.deepEqual(request.settings?.targetEntityTypes, ['Product', 'Content']);
    });

    test('adds an optional term', () => {
        const request = buildPopularSearchTermsRequest({
            settings,
            take: 5,
            targetEntityTypes: ['Product'],
            term: 'shoe',
        });

        assert.equal(request.term, 'shoe');
    });
});
