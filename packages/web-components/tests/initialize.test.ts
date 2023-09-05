import { assert } from '@esm-bundle/chai';
import { PopularProductsBuilder, UserFactory } from '@relewise/client';
import { initializeRelewiseUI } from '../src';
import { defaultProductProperties } from '../src/defaultProductProperties';
import { getProductRecommendationBuilderWithDefaults, getRelewiseContextSettings, getRelewiseUIOptions } from '../src/initialize';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('initialize', () => {
    test('initializeRelewiseUI sets values on window', () => {
        const mockedRelewiseOptions = mockRelewiseOptions();
        initializeRelewiseUI(mockedRelewiseOptions);
    
        assert.isDefined(window.relewiseUIOptions);
        assert.deepEqual(window.relewiseUIOptions, mockedRelewiseOptions);
    });
    
    test('getRelewiseUIOptions throws error when ui not initialized', () => {
        window.relewiseUIOptions = undefined!;

        assert.Throw(() =>  getRelewiseUIOptions());
    });
    
    test('getRelewiseUIOptions when no dataset id found', () => {
        const mockedRelewiseOptions = mockRelewiseOptions();
        initializeRelewiseUI(mockedRelewiseOptions);
    
        window.relewiseUIOptions.datasetId = undefined!;
    
        assert.Throw(() =>  getRelewiseUIOptions());
    });
    
    test('getRelewiseUIOptions when no api key found', () => {
        const mockedRelewiseOptions = mockRelewiseOptions();
        initializeRelewiseUI(mockedRelewiseOptions);
    
        window.relewiseUIOptions.apiKey = undefined!;
        
        assert.Throw(() =>  getRelewiseUIOptions());
    });
    
    test('getRelewiseUIOptions when no api context settings found', () => {
        const mockedRelewiseOptions = mockRelewiseOptions();
        initializeRelewiseUI(mockedRelewiseOptions);
    
        window.relewiseUIOptions.contextSettings = undefined!;
        
        assert.Throw(() =>  getRelewiseUIOptions());
    });
    
    test('getRelewiseUIOptions finds correct Options', () => {
        const mockedRelewiseOptions = mockRelewiseOptions();
        initializeRelewiseUI(mockedRelewiseOptions);
        const result = getRelewiseUIOptions();
    
        assert.isDefined(result);
        assert.deepEqual(result, mockedRelewiseOptions);
    });
    
    test('getRelewiseContextOptions finds correct context settings', () => {
        const mockedRelewiseOptions = mockRelewiseOptions();
        initializeRelewiseUI(mockedRelewiseOptions);
    
        const expected = {
            currency: mockedRelewiseOptions.contextSettings.currency,
            displayedAtLocation: mockedRelewiseOptions.contextSettings.displayedAtLocation,
            language: mockedRelewiseOptions.contextSettings.language,
            user: mockedRelewiseOptions.contextSettings.getUser(UserFactory),
        }
    
        const result = getRelewiseContextSettings();
    
        assert.isDefined(result);
        assert.deepEqual(result, expected);
    });
    
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
