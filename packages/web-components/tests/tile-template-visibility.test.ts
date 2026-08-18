import { assert, fixture, fixtureCleanup, html } from '@open-wc/testing';
import { ContentResult, ProductResult } from '@relewise/client';
import { ContentTile, initializeRelewiseUI, ProductTile } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

function product(productId = 'product'): ProductResult {
    return { productId, displayName: productId, data: {} } as unknown as ProductResult;
}

function content(contentId = 'content'): ContentResult {
    return { contentId, displayName: contentId, data: {} } as unknown as ContentResult;
}

suite('tile template visibility', () => {
    teardown(() => {
        fixtureCleanup();
        window.relewiseUIOptions = undefined!;
    });

    test('applies display name alignment to product and content tiles', async() => {
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const productElement = await fixture<ProductTile>(html`
            <relewise-product-tile
                style="--relewise-display-name-alignment: center"
                .product=${product()}>
            </relewise-product-tile>
        `);
        const contentElement = await fixture<ContentTile>(html`
            <relewise-content-tile
                style="--relewise-display-name-alignment: end"
                .content=${content()}>
            </relewise-content-tile>
        `);

        assert.equal(getComputedStyle(productElement.shadowRoot!.querySelector('.rw-display-name')!).textAlign, 'center');
        assert.equal(getComputedStyle(contentElement.shadowRoot!.querySelector('.rw-display-name')!).textAlign, 'end');
    });

    test('product tile removes hidden when a later synchronous template is visible', async() => {
        let visible = false;
        const options = mockRelewiseOptions();
        options.templates = {
            product: (_product, { html, helpers }) => visible ? html`<span>Visible product</span>` : helpers.nothing,
        };
        initializeRelewiseUI(options).useRecommendations();
        const element = await fixture<ProductTile>(html`
            <relewise-product-tile .product=${product()}></relewise-product-tile>
        `);
        await element.updateComplete;
        assert.isTrue(element.hidden);

        visible = true;
        element.requestUpdate();
        await element.updateComplete;

        assert.isFalse(element.hidden);
        assert.equal(element.shadowRoot!.textContent?.trim(), 'Visible product');
    });

    test('content tile removes hidden when a later synchronous template is visible', async() => {
        let visible = false;
        const options = mockRelewiseOptions();
        options.templates = {
            content: (_content, { html, helpers }) => visible ? html`<span>Visible content</span>` : helpers.nothing,
        };
        initializeRelewiseUI(options).useRecommendations();
        const element = await fixture<ContentTile>(html`
            <relewise-content-tile .content=${content()}></relewise-content-tile>
        `);
        await element.updateComplete;
        assert.isTrue(element.hidden);

        visible = true;
        element.requestUpdate();
        await element.updateComplete;

        assert.isFalse(element.hidden);
        assert.equal(element.shadowRoot!.textContent?.trim(), 'Visible content');
    });

});
