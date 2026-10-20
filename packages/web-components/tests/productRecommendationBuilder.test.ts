import { assert } from '@esm-bundle/chai';
import { PopularProductsBuilder } from '@relewise/client';
import { getProductRecommendationBuilderWithDefaults, getRelewiseContextSettings, getSelectedProductProperties, initializeRelewiseUI, useRecommendations } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('productRecommendationBuilder', () => {
    test('getProductRecommendationBuilderWithDefaults returns builder with defaults if no selectedPropertiesSettings provided', async() => {
        const mockedRelewiseOptions = mockRelewiseOptions();
        mockedRelewiseOptions.selectedPropertiesSettings = undefined!;
        initializeRelewiseUI(mockedRelewiseOptions);

        const expected = new PopularProductsBuilder(
            await getRelewiseContextSettings('web-components-tests'))
            .setSelectedProductProperties(getSelectedProductProperties(mockedRelewiseOptions))
            .build();
        const result = (await getProductRecommendationBuilderWithDefaults<PopularProductsBuilder>(Options => new PopularProductsBuilder(Options), 'web-components-tests')).build();

        assert.deepEqual(expected.settings.selectedProductProperties, result.settings.selectedProductProperties);
    });

    test('getProductRecommendationBuilderWithDefaults returns builder with options from initializeRelewiseUI', async() => {
        const mockedRelewiseOptions = mockRelewiseOptions();
        initializeRelewiseUI(mockedRelewiseOptions);

        const expected = new PopularProductsBuilder(
            await getRelewiseContextSettings('web-components-tests'))
            .setSelectedProductProperties(getSelectedProductProperties(mockedRelewiseOptions)).build();
        const result = (await getProductRecommendationBuilderWithDefaults<PopularProductsBuilder>(Options => new PopularProductsBuilder(Options), 'web-components-tests')).build();

        assert.deepEqual(expected.settings.selectedProductProperties, result.settings.selectedProductProperties);
    });

    test('combines global, recommendation, and targeted context values with later scopes taking precedence', async() => {
        const options = mockRelewiseOptions();
        options.contextValues = {
            DeviceType: 'Desktop',
            Market: 'DK',
        };
        options.targets = {
            recommendationTargets: configurations => configurations.add({
                target: 'mobile',
                configuration: {
                    contextValues: {
                        DeviceType: 'Mobile',
                        Campaign: 'Summer',
                    },
                },
            }),
        };
        initializeRelewiseUI(options);
        useRecommendations({
            contextValues: {
                DeviceType: 'Tablet',
                PageId: 'page-1',
            },
        });

        const request = (await getProductRecommendationBuilderWithDefaults(
            settings => new PopularProductsBuilder(settings),
            'web-components-tests',
            'mobile',
        )).build();

        assert.deepEqual(request.contextValues, {
            DeviceType: 'Mobile',
            Market: 'DK',
            PageId: 'page-1',
            Campaign: 'Summer',
        });
    });
});
