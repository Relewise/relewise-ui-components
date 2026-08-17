import { assert, fixture, fixtureCleanup, html } from '@open-wc/testing';
import { ContentResult, ProductResult } from '@relewise/client';
import { nothing, TemplateResult } from 'lit';
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

    test('stale asynchronous product template cannot hide newer content', async() => {
        let resolveOld!: (result: TemplateResult<1> | typeof nothing) => void;
        const oldResult = new Promise<TemplateResult<1> | typeof nothing>(resolve => resolveOld = resolve);
        const options = mockRelewiseOptions();
        options.templates = {
            product: (product, { html }) => product.productId === 'old' ? oldResult : html`<span>New product</span>`,
        };
        initializeRelewiseUI(options).useRecommendations();
        const element = await fixture<ProductTile>(html`
            <relewise-product-tile .product=${product('old')}></relewise-product-tile>
        `);
        await element.updateComplete;

        element.product = product('new');
        await element.updateComplete;
        resolveOld(nothing);
        await new Promise(resolve => setTimeout(resolve, 0));

        assert.isFalse(element.hidden);
        assert.equal(element.shadowRoot!.textContent?.trim(), 'New product');
    });

    test('stale asynchronous content template cannot hide newer content', async() => {
        let resolveOld!: (result: TemplateResult<1> | typeof nothing) => void;
        const oldResult = new Promise<TemplateResult<1> | typeof nothing>(resolve => resolveOld = resolve);
        const options = mockRelewiseOptions();
        options.templates = {
            content: (content, { html }) => content.contentId === 'old' ? oldResult : html`<span>New content</span>`,
        };
        initializeRelewiseUI(options).useRecommendations();
        const element = await fixture<ContentTile>(html`
            <relewise-content-tile .content=${content('old')}></relewise-content-tile>
        `);
        await element.updateComplete;

        element.content = content('new');
        await element.updateComplete;
        resolveOld(nothing);
        await new Promise(resolve => setTimeout(resolve, 0));

        assert.isFalse(element.hidden);
        assert.equal(element.shadowRoot!.textContent?.trim(), 'New content');
    });

    test('asynchronous product template cannot hide a disconnected tile', async() => {
        let resolveTemplate!: (result: TemplateResult<1> | typeof nothing) => void;
        const templateResult = new Promise<TemplateResult<1> | typeof nothing>(resolve => resolveTemplate = resolve);
        const options = mockRelewiseOptions();
        options.templates = { product: () => templateResult };
        initializeRelewiseUI(options).useRecommendations();
        const element = await fixture<ProductTile>(html`
            <relewise-product-tile .product=${product()}></relewise-product-tile>
        `);

        element.remove();
        resolveTemplate(nothing);
        await new Promise(resolve => setTimeout(resolve, 0));

        assert.isFalse(element.hidden);
    });

    test('asynchronous content template cannot hide a disconnected tile', async() => {
        let resolveTemplate!: (result: TemplateResult<1> | typeof nothing) => void;
        const templateResult = new Promise<TemplateResult<1> | typeof nothing>(resolve => resolveTemplate = resolve);
        const options = mockRelewiseOptions();
        options.templates = { content: () => templateResult };
        initializeRelewiseUI(options).useRecommendations();
        const element = await fixture<ContentTile>(html`
            <relewise-content-tile .content=${content()}></relewise-content-tile>
        `);

        element.remove();
        resolveTemplate(nothing);
        await new Promise(resolve => setTimeout(resolve, 0));

        assert.isFalse(element.hidden);
    });
});
