import { assert, fixture, fixtureCleanup, html } from '@open-wc/testing';
import { ContentResult, ProductResult } from '@relewise/client';
import { html as litHtml } from 'lit';
import { initializeRelewiseUI } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('tile field mapping', () => {
    setup(() => {
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
    });

    teardown(() => {
        fixtureCleanup();
        window.relewiseUIOptions = undefined!;
    });

    test('product tile uses configured data keys for default rendering', async () => {
        const product = {
            displayName: 'Default product name',
            rank: 1,
            salesPrice: 10,
            listPrice: 15,
            data: {
                CustomImage: dataValue('/images/product.jpg'),
                CustomUrl: dataValue('/products/custom'),
                CustomName: dataValue('Custom product name'),
                CustomDescription: dataValue('Custom product description'),
                CustomSalesPrice: dataValue(20),
                CustomListPrice: dataValue(25),
            },
        } as ProductResult;

        const el = await fixture(html`
            <relewise-product-tile
                .product=${product}
                image-data-key="CustomImage"
                image-base-url="https://cdn.example.com"
                url-data-key="CustomUrl"
                display-name-data-key="CustomName"
                description-data-key="CustomDescription"
                sales-price-data-key="CustomSalesPrice"
                list-price-data-key="CustomListPrice">
            </relewise-product-tile>
        `);

        const anchor = el.shadowRoot!.querySelector('a')!;
        const image = el.shadowRoot!.querySelector('img')!;

        assert.equal(anchor.getAttribute('href'), '/products/custom');
        assert.equal(image.getAttribute('src'), 'https://cdn.example.com/images/product.jpg');
        assert.include(el.shadowRoot!.textContent!, 'Custom product name');
        assert.include(el.shadowRoot!.textContent!, 'Custom product description');
        assert.include(el.shadowRoot!.textContent!, '20');
        assert.include(el.shadowRoot!.textContent!, '25');
    });

    test('product tile keeps existing defaults when data key attributes are absent', async () => {
        const product = {
            displayName: 'Default product name',
            rank: 1,
            salesPrice: 10,
            listPrice: 15,
            data: {
                ImageUrl: dataValue('data:image/gif;base64,R0lGODlhAQABAAAAACw='),
                Url: dataValue('/products/default'),
            },
        } as ProductResult;

        const el = await fixture(html`
            <relewise-product-tile .product=${product}></relewise-product-tile>
        `);

        assert.equal(el.shadowRoot!.querySelector('a')!.getAttribute('href'), '/products/default');
        assert.equal(el.shadowRoot!.querySelector('img')!.getAttribute('src'), 'data:image/gif;base64,R0lGODlhAQABAAAAACw=');
        assert.include(el.shadowRoot!.textContent!, 'Default product name');
    });

    test('content tile uses configured data keys for default rendering', async () => {
        const content = {
            displayName: 'Default content name',
            rank: 1,
            data: {
                CustomImage: dataValue('/images/content.jpg'),
                CustomUrl: dataValue('/content/custom'),
                CustomName: dataValue('Custom content name'),
                CustomDescription: dataValue('Custom content description'),
            },
        } as ContentResult;

        const el = await fixture(html`
            <relewise-content-tile
                .content=${content}
                image-data-key="CustomImage"
                image-base-url="https://cdn.example.com"
                url-data-key="CustomUrl"
                display-name-data-key="CustomName"
                description-data-key="CustomDescription">
            </relewise-content-tile>
        `);

        const anchor = el.shadowRoot!.querySelector('a')!;
        const image = el.shadowRoot!.querySelector('img')!;

        assert.equal(anchor.getAttribute('href'), '/content/custom');
        assert.equal(image.getAttribute('src'), 'https://cdn.example.com/images/content.jpg');
        assert.include(el.shadowRoot!.textContent!, 'Custom content name');
        assert.include(el.shadowRoot!.textContent!, 'Custom content description');
    });

    test('content tile keeps existing default summary rendering when description data key is absent', async () => {
        const content = {
            displayName: 'Default content name',
            rank: 1,
            data: {
                Summary: dataValue('Default summary'),
            },
        } as ContentResult;

        const el = await fixture(html`
            <relewise-content-tile .content=${content}></relewise-content-tile>
        `);

        assert.include(el.shadowRoot!.textContent!, 'Default content name');
        assert.include(el.shadowRoot!.textContent!, 'Default summary');
    });

    test('product template override still controls rendering', async () => {
        initializeRelewiseUI({
            ...mockRelewiseOptions(),
            templates: {
                product: product => litHtml`<div class="custom-template">${product.displayName}</div>`,
            },
        }).useRecommendations();

        const product = {
            displayName: 'Template product',
            rank: 1,
            data: {
                CustomName: dataValue('Mapped product'),
            },
        } as ProductResult;

        const el = await fixture(html`
            <relewise-product-tile
                .product=${product}
                display-name-data-key="CustomName">
            </relewise-product-tile>
        `);

        assert.include(el.shadowRoot!.textContent!, 'Template product');
        assert.notInclude(el.shadowRoot!.textContent!, 'Mapped product');
    });
});

function dataValue(value: unknown) {
    return {
        type: 'String',
        value,
        isCollection: false,
    };
}
