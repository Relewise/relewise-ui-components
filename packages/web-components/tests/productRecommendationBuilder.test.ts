import { assert } from '@esm-bundle/chai';
import { PopularProductsBuilder } from '@relewise/client';
import { getProductRecommendationBuilderWithDefaults, getRelewiseContextSettings, initializeRelewiseUI } from '../src';
import { defaultProductProperties } from '../src/defaultProductProperties';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('productRecommendationBuilder', () => {
    test('getProductRecommendationBuilderWithDefaults returns builder with defaults if no selectedPropertiesSettings provided', () => {
        const mockedRelewiseOptions = mockRelewiseOptions();
        mockedRelewiseOptions.selectedPropertiesSettings = undefined!;
        initializeRelewiseUI(mockedRelewiseOptions);
    
        const expected = new PopularProductsBuilder(getRelewiseContextSettings()).setSelectedProductProperties(defaultProductProperties).build();
        const result = getProductRecommendationBuilderWithDefaults<PopularProductsBuilder>(Options => new PopularProductsBuilder(Options)).build();;
        
        assert.deepEqual(expected.settings.selectedProductProperties, result.settings.selectedProductProperties)
    });
    
    test('getProductRecommendationBuilderWithDefaults returns builder with options from initializeRelewiseUI', () => {
        const mockedRelewiseOptions = mockRelewiseOptions();
        initializeRelewiseUI(mockedRelewiseOptions);
    
        const expected = new PopularProductsBuilder(getRelewiseContextSettings()).setSelectedProductProperties(mockedRelewiseOptions.selectedPropertiesSettings!.product!).build();
        const result = getProductRecommendationBuilderWithDefaults<PopularProductsBuilder>(Options => new PopularProductsBuilder(Options)).build();
        
        assert.deepEqual(expected.settings.selectedProductProperties, result.settings.selectedProductProperties)
    });
})
