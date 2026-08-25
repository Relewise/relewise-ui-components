import { assert } from '@esm-bundle/chai';
import { getRelewiseUISearchOptions, initializeRelewiseUI } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('initialize', () => {
    test('initializeRelewiseUI sets values on window', () => {
        const mockedRelewiseOptions = mockRelewiseOptions();
        initializeRelewiseUI(mockedRelewiseOptions);
    
        assert.isDefined(window.relewiseUIOptions);
        assert.deepEqual(window.relewiseUIOptions, mockedRelewiseOptions);
    });

    test('useSearch applies backward-compatible request timing defaults', () => {
        initializeRelewiseUI(mockRelewiseOptions()).useSearch();

        assert.deepEqual(getRelewiseUISearchOptions(), {
            debounceTimeInMs: 250,
            minimumQueryLength: 1,
        });
    });

    test('useSearch preserves configured request timing', () => {
        initializeRelewiseUI(mockRelewiseOptions()).useSearch({
            debounceTimeInMs: 500,
            minimumQueryLength: 3,
        });

        assert.equal(getRelewiseUISearchOptions()?.debounceTimeInMs, 500);
        assert.equal(getRelewiseUISearchOptions()?.minimumQueryLength, 3);
    });
});
