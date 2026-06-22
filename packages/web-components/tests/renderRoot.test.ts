import { assert, fixture, html } from '@open-wc/testing';
import { ProductResult } from '@relewise/client';
import { initializeRelewiseUI, ProductTile } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

function product(): ProductResult {
    return {
        productId: 'product-1',
        rank: 1,
        displayName: 'Test product',
        salesPrice: 10,
        listPrice: 12,
        data: {
            Url: {
                type: 'String',
                isCollection: false,
                value: '/products/test-product',
            },
        },
    } as ProductResult;
}

suite('domMode', () => {
    test('renders into shadow DOM by default', async() => {
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();

        const el = await fixture<ProductTile>(html`<relewise-product-tile .product=${product()}></relewise-product-tile>`);
        await el.updateComplete;

        assert.exists(el.shadowRoot);
        assert.exists(el.shadowRoot!.querySelector('.rw-tile'));
        assert.notExists(el.querySelector('.rw-tile'));
    });

    test('renders into light DOM when configured', async() => {
        const options = mockRelewiseOptions();
        options.components = {
            domMode: 'light',
        };
        initializeRelewiseUI(options).useRecommendations();

        const wrapper = await fixture<HTMLElement>(html`
            <div>
                <style>
                    relewise-product-tile .rw-tile {
                        color: rgb(1, 2, 3);
                    }
                </style>
                <relewise-product-tile .product=${product()}></relewise-product-tile>
            </div>
        `);
        const el = wrapper.querySelector('relewise-product-tile') as ProductTile;
        await el.updateComplete;

        assert.notExists(el.shadowRoot);
        const tile = el.querySelector('.rw-tile') as HTMLElement;
        assert.exists(tile);
        assert.equal(getComputedStyle(tile).color, 'rgb(1, 2, 3)');
    });

    test('renders customer product templates into queryable light DOM', async() => {
        const options = mockRelewiseOptions();
        options.components = {
            domMode: 'light',
        };
        options.templates = {
            product: (product, { html }) => html`<article class="customer-product-template">${product.displayName}</article>`,
        };
        initializeRelewiseUI(options).useRecommendations();

        const el = await fixture<ProductTile>(html`<relewise-product-tile .product=${product()}></relewise-product-tile>`);
        await el.updateComplete;

        assert.equal(el.querySelector('.customer-product-template')?.textContent, 'Test product');
    });
});
