import { assert } from '@esm-bundle/chai';
import {
    PopularContentCategoriesRecommendationBuilder,
    PopularProductCategoriesRecommendationBuilder,
} from '@relewise/client';
import {
    getContentCategoryRecommendationBuilderWithDefaults,
    getProductCategoryRecommendationBuilderWithDefaults,
} from '../src/builders/categoryRecommendationBuilder';
import { createProductCategorySearchBuilder } from '../src/builders/productCategorySearchBuilder';
import { getRelewiseContextSettings } from '../src/helpers/relewiseUIOptions';
import { initializeRelewiseUI } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('categoryRecommendationBuilder', () => {
    test('selects the properties used by the default category tiles', async() => {
        initializeRelewiseUI(mockRelewiseOptions());

        const productRequest = (await getProductCategoryRecommendationBuilderWithDefaults(
            settings => new PopularProductCategoriesRecommendationBuilder(settings),
            'product categories',
        )).build();
        const contentRequest = (await getContentCategoryRecommendationBuilderWithDefaults(
            settings => new PopularContentCategoriesRecommendationBuilder(settings),
            'content categories',
        )).build();
        const searchRequest = createProductCategorySearchBuilder(
            'category',
            await getRelewiseContextSettings('product category search'),
        ).build();

        assert.deepEqual(productRequest.settings.selectedProductCategoryProperties?.dataKeys, ['ImageUrl', 'Url']);
        assert.deepEqual(contentRequest.settings.selectedContentCategoryProperties?.dataKeys, ['ImageUrl', 'Url']);
        assert.deepEqual(searchRequest.settings?.selectedCategoryProperties?.dataKeys, ['Url']);
    });

    test('preserves explicit category selected properties including ImageUrl', async() => {
        const options = mockRelewiseOptions();
        options.selectedPropertiesSettings = {
            productCategory: {
                displayName: false,
                paths: false,
                dataKeys: ['Url', 'ImageUrl', 'ProductCategoryData'],
            },
            contentCategory: {
                displayName: false,
                paths: false,
                dataKeys: ['Url', 'ImageUrl', 'ContentCategoryData'],
            },
        };
        initializeRelewiseUI(options);

        const productRequest = (await getProductCategoryRecommendationBuilderWithDefaults(
            settings => new PopularProductCategoriesRecommendationBuilder(settings),
            'product categories',
        )).build();
        const contentRequest = (await getContentCategoryRecommendationBuilderWithDefaults(
            settings => new PopularContentCategoriesRecommendationBuilder(settings),
            'content categories',
        )).build();

        assert.deepEqual(productRequest.settings.selectedProductCategoryProperties?.dataKeys, ['Url', 'ImageUrl', 'ProductCategoryData']);
        assert.isFalse(productRequest.settings.selectedProductCategoryProperties?.displayName);
        assert.isFalse(productRequest.settings.selectedProductCategoryProperties?.paths);
        assert.deepEqual(contentRequest.settings.selectedContentCategoryProperties?.dataKeys, ['Url', 'ImageUrl', 'ContentCategoryData']);
        assert.isFalse(contentRequest.settings.selectedContentCategoryProperties?.displayName);
        assert.isFalse(contentRequest.settings.selectedContentCategoryProperties?.paths);
    });

    test('applies global and targeted product category configuration', async() => {
        const calls: string[] = [];
        const options = mockRelewiseOptions();
        options.filters = { productCategory: () => calls.push('global filter') };
        options.relevanceModifiers = { productCategory: () => calls.push('global relevance') };
        options.targets = {
            recommendationTargets: configurations => configurations.add({
                target: 'category target',
                configuration: {
                    filters: () => calls.push('target filter'),
                    relevanceModifiers: () => calls.push('target relevance'),
                },
            }),
        };
        initializeRelewiseUI(options);

        (await getProductCategoryRecommendationBuilderWithDefaults(
            settings => new PopularProductCategoriesRecommendationBuilder(settings),
            'product categories',
            'category target',
        )).build();

        assert.deepEqual(calls, ['global relevance', 'global filter', 'target filter', 'target relevance']);
    });

    test('applies global and targeted content category configuration', async() => {
        const calls: string[] = [];
        const options = mockRelewiseOptions();
        options.filters = { contentCategory: () => calls.push('global filter') };
        options.relevanceModifiers = { contentCategory: () => calls.push('global relevance') };
        options.targets = {
            recommendationTargets: configurations => configurations.add({
                target: 'category target',
                configuration: {
                    filters: () => calls.push('target filter'),
                    relevanceModifiers: () => calls.push('target relevance'),
                },
            }),
        };
        initializeRelewiseUI(options);

        (await getContentCategoryRecommendationBuilderWithDefaults(
            settings => new PopularContentCategoriesRecommendationBuilder(settings),
            'content categories',
            'category target',
        )).build();

        assert.deepEqual(calls, ['global relevance', 'global filter', 'target filter', 'target relevance']);
    });
});
