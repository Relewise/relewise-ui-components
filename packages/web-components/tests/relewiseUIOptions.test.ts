import { assert } from '@esm-bundle/chai';
import { getRelewiseContextSettings, getRelewiseUIOptions, initializeRelewiseUI } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('relewiseUIOptions', () => {
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
        const displayedAtLocation = 'displayedAtLocation';
    
        const expected = {
            currency: mockedRelewiseOptions.contextSettings.currency,
            displayedAtLocation: displayedAtLocation,
            language: mockedRelewiseOptions.contextSettings.language,
            user: mockedRelewiseOptions.contextSettings.getUser(),
        }
    
        const result = getRelewiseContextSettings(displayedAtLocation);
    
        assert.isDefined(result);
        assert.deepEqual(result, expected);
    });
})
