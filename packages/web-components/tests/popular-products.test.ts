import { assert } from '@esm-bundle/chai';
import { PopularProducts, initializeRelewiseUI } from '../src';
import { mockRelewiseSettings } from './util/mockRelewiseUISettings';

it('is not intance of when relewise not instantiated', () => {
    const el = document.createElement('relewise-popular-products');
    assert.notInstanceOf(el, PopularProducts)
});

it('is intance of when relewise is instantiated', async() => {

    initializeRelewiseUI(mockRelewiseSettings());

    const el = document.createElement('relewise-popular-products');
    assert.instanceOf(el, PopularProducts);
});