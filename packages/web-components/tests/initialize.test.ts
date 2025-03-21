import { assert } from '@esm-bundle/chai';
import { getRelewiseUIOptions, initializeRelewiseUI } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('initialize', () => {
    test('initializeRelewiseUI sets values on window', () => {
        const mockedRelewiseOptions = mockRelewiseOptions();
        initializeRelewiseUI(mockedRelewiseOptions);
    
        assert.isDefined(getRelewiseUIOptions());
        assert.deepEqual(getRelewiseUIOptions(), mockedRelewiseOptions);
    });
});
