import { assert } from '@open-wc/testing';
import { Settings, UserFactory } from '@relewise/client';
import { initializeRelewiseUI } from '../src';
import { buildRecommendationBlockRequest } from '../src/recommendations/recommendationBlockRequestBuilder';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

function settings(user = UserFactory.byTemporaryId('temporary-id')): Settings {
    return {
        user,
        language: 'en',
        currency: 'USD',
        displayedAtLocation: 'Universal Search',
    };
}

suite('recommendationBlockRequestBuilder', () => {
    setup(() => {
        initializeRelewiseUI(mockRelewiseOptions());
    });

    teardown(() => {
        window.relewiseUIOptions = undefined!;
    });

    const recommendationTypes = [
        ['PopularProducts', 'PopularProductsRequest', 'products'],
        ['RecentlyViewedProducts', 'RecentlyViewedProductsRequest', 'products'],
        ['PopularProductCategories', 'PopularProductCategoriesRecommendationRequest', 'productCategories'],
        ['PopularContents', 'PopularContentsRequest', 'content'],
        ['PopularContentCategories', 'PopularContentCategoriesRecommendationRequest', 'contentCategories'],
        ['PopularSearchTerms', 'PopularSearchTermsRecommendationRequest', 'searchTerms'],
        ['SearchTermBasedProduct', 'SearchTermBasedProductRecommendationRequest', 'products'],
    ] as const;

    recommendationTypes.forEach(([type, requestType, resultType]) => {
        test(`builds ${type}`, () => {
            const result = buildRecommendationBlockRequest({
                block: { type, take: 3 },
                settings: settings(),
                targetEntityTypes: ['Product', 'Content'],
                term: 'Trail shoes',
            });

            assert.isNotNull(result);
            assert.include(result!.request.$type, requestType);
            assert.equal(result!.resultType, resultType);
            assert.equal(result!.request.settings?.numberOfRecommendations, 3);
        });
    });

    test('does not request recently viewed products for an anonymous user', () => {
        const result = buildRecommendationBlockRequest({
            block: { type: 'RecentlyViewedProducts' },
            settings: settings(UserFactory.anonymous()),
            targetEntityTypes: ['Product'],
            term: '',
        });

        assert.isNull(result);
    });

    test('only builds search-term-based products when a term is available', () => {
        const result = buildRecommendationBlockRequest({
            block: { type: 'SearchTermBasedProduct' },
            settings: settings(),
            targetEntityTypes: ['Product'],
            term: '',
        });

        assert.isNull(result);
    });

    test('uses the search term for popular search term recommendations', () => {
        const result = buildRecommendationBlockRequest({
            block: { type: 'PopularSearchTerms' },
            settings: settings(),
            targetEntityTypes: ['Product', 'Content'],
            term: 'Trail shoes',
        });

        assert.equal(result?.resultType, 'searchTerms');
        if (result?.resultType === 'searchTerms') {
            assert.equal(result.request.term, 'Trail shoes');
        }
    });

    test('uses four recommendations by default', () => {
        const result = buildRecommendationBlockRequest({
            block: { type: 'PopularProducts' },
            settings: settings(),
            targetEntityTypes: ['Product'],
            term: '',
        });

        assert.equal(result?.request.settings?.numberOfRecommendations, 4);
    });

    test('does not build a block with a non-positive take', () => {
        const result = buildRecommendationBlockRequest({
            block: { type: 'PopularProducts', take: 0 },
            settings: settings(),
            targetEntityTypes: ['Product'],
            term: '',
        });

        assert.isNull(result);
    });

    test('applies configured content-category properties, filters, and relevance modifiers', () => {
        let filterApplied = false;
        let relevanceModifierApplied = false;
        const options = mockRelewiseOptions();
        options.selectedPropertiesSettings = {
            ...options.selectedPropertiesSettings,
            contentCategory: {
                displayName: true,
                dataKeys: ['CustomImage'],
            },
        };
        options.filters = {
            contentCategory: () => {
                filterApplied = true;
            },
        };
        options.relevanceModifiers = {
            contentCategory: () => {
                relevanceModifierApplied = true;
            },
        };
        initializeRelewiseUI(options);

        const result = buildRecommendationBlockRequest({
            block: { type: 'PopularContentCategories' },
            settings: settings(),
            targetEntityTypes: ['Content'],
            term: '',
        });

        assert.equal(result?.resultType, 'contentCategories');
        if (result?.resultType === 'contentCategories') {
            assert.deepEqual(result.request.settings.selectedContentCategoryProperties?.dataKeys, ['CustomImage']);
        }
        assert.isTrue(filterApplied);
        assert.isTrue(relevanceModifierApplied);
    });
});
