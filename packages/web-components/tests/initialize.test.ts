import { assert } from '@esm-bundle/chai';
import { initializeRelewiseUI } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('initialize', () => {
    test('initializeRelewiseUI sets values on window', () => {
        const mockedRelewiseOptions = mockRelewiseOptions();
        initializeRelewiseUI(mockedRelewiseOptions);
    
        assert.isDefined(window.relewiseUIOptions);
        assert.deepEqual(window.relewiseUIOptions, mockedRelewiseOptions);
    });
});
