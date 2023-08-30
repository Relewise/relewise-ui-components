import { assert } from '@esm-bundle/chai';
import { PopularProducts, initializeRelewiseUI } from '../src';
import { UserFactory } from '@relewise/client';

it('is not intance of when relewise not instantiated', () => {
    const el = document.createElement('relewise-popular-products');
    assert.notInstanceOf(el, PopularProducts)
});

it('is intance of when relewise is instantiated', async() => {

    initializeRelewiseUI({
        contextSettings: {
            getUser: () => {
                return UserFactory.anonymous();
            },
            language: '',
            currency: '',   
            displayedAtLocation: '',
        },
        datasetId: '',
        apiKey: '',
    });

    const el = document.createElement('relewise-popular-products');
    assert.instanceOf(el, PopularProducts);
});