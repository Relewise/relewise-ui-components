import { assert } from '@esm-bundle/chai';
import { PopularProductsBuilder } from '@relewise/client';
import { getProductRecommendationBuilderWithDefaults, getRelewiseContextSettings, getSelectedProductProperties, initializeRelewiseUI } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('productRecommendationBuilder', () => {
    test('getProductRecommendationBuilderWithDefaults returns builder with defaults if no selectedPropertiesSettings provided', async () => {
        const mockedRelewiseOptions = mockRelewiseOptions();
        mockedRelewiseOptions.selectedPropertiesSettings = undefined!;
        initializeRelewiseUI(mockedRelewiseOptions);

        const expected = new PopularProductsBuilder(
            getRelewiseContextSettings('web-components-tests'))
            .setSelectedProductProperties(getSelectedProductProperties(mockedRelewiseOptions))
            .build();
        const result = (await getProductRecommendationBuilderWithDefaults<PopularProductsBuilder>(Options => new PopularProductsBuilder(Options), 'web-components-tests')).build();

        assert.deepEqual(expected.settings.selectedProductProperties, result.settings.selectedProductProperties);
    });

    test('getProductRecommendationBuilderWithDefaults returns builder with options from initializeRelewiseUI', async () => {
        const mockedRelewiseOptions = mockRelewiseOptions();
        initializeRelewiseUI(mockedRelewiseOptions);

        const expected = new PopularProductsBuilder
            (getRelewiseContextSettings('web-components-tests'))
            .setSelectedProductProperties(getSelectedProductProperties(mockedRelewiseOptions)).build();
        const result = (await getProductRecommendationBuilderWithDefaults<PopularProductsBuilder>(Options => new PopularProductsBuilder(Options), 'web-components-tests')).build();

        assert.deepEqual(expected.settings.selectedProductProperties, result.settings.selectedProductProperties);
    });
});
