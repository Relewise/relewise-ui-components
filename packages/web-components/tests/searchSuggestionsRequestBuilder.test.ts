import { assert } from '@esm-bundle/chai';
import { Settings, UserFactory } from '@relewise/client';
import { buildPopularSearchTermsRequest, buildSearchTermPredictionRequest } from '../src/builders/searchSuggestionsRequestBuilder';
import { initializeRelewiseUI, useSearch } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

const settings: Settings = {
    currency: 'currency',
    displayedAtLocation: 'Universal Search',
    language: 'language',
    user: UserFactory.anonymous(),
};

suite('searchSuggestionsRequestBuilder', () => {
    setup(() => {
        const options = mockRelewiseOptions();
        options.getContextValues = async() => ({ DeviceType: 'Desktop', Market: 'DK' });
        initializeRelewiseUI(options);
        useSearch({ getContextValues: async() => ({ DeviceType: 'Mobile', SearchExperience: 'Universal' }) });
    });

    test('builds a popular search terms request', async() => {
        const request = await buildPopularSearchTermsRequest({
            settings,
            take: 5,
            targetEntityTypes: ['Product', 'Content'],
        });

        assert.equal(request.settings?.numberOfRecommendations, 5);
        assert.deepEqual(request.settings?.targetEntityTypes, ['Product', 'Content']);
        assert.deepEqual(request.contextValues, {
            DeviceType: 'Mobile',
            Market: 'DK',
            SearchExperience: 'Universal',
        });
    });

    test('builds a search term prediction request', async() => {
        const request = await buildSearchTermPredictionRequest({
            settings,
            term: 'shoe',
            take: 7,
            targetEntityTypes: ['Product', 'ProductCategory', 'Content'],
        });

        assert.equal(request.term, 'shoe');
        assert.equal(request.take, 7);
        assert.deepEqual(request.settings?.targetEntityTypes, ['Product', 'ProductCategory', 'Content']);
        assert.deepEqual(request.contextValues, {
            DeviceType: 'Mobile',
            Market: 'DK',
            SearchExperience: 'Universal',
        });
    });
});
