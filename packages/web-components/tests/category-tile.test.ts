import { assert, fixture, fixtureCleanup, html } from '@open-wc/testing';
import { ContentCategoryResult, ProductCategoryResult } from '@relewise/client';
import { nothing, TemplateResult } from 'lit';
import {
    ContentCategoryTile,
    initializeRelewiseUI,
    ProductCategoryTile,
} from '../src';
import { clearRegisteredLightDomStylesForTesting } from '../src/lightDomStyles';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

const imageUrl = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

function productCategory(categoryId = 'product-category'): ProductCategoryResult {
    return {
        categoryId,
        displayName: 'Product category',
        rank: 1,
        data: {
            Url: { type: 'String', isCollection: false, value: '/product-category' },
            ImageUrl: { type: 'String', isCollection: false, value: imageUrl },
        },
    } as unknown as ProductCategoryResult;
}

function contentCategory(categoryId = 'content-category'): ContentCategoryResult {
    return {
        categoryId,
        displayName: 'Content category',
        rank: 1,
        data: {
            ImageUrl: { type: 'String', isCollection: false, value: imageUrl },
        },
    } as unknown as ContentCategoryResult;
}

suite('category tiles', () => {
    teardown(() => {
        fixtureCleanup();
        clearRegisteredLightDomStylesForTesting();
        window.relewiseUIOptions = undefined!;
    });

    test('registers and renders the product category contract in Shadow DOM', async() => {
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const category = productCategory();
        const element = await fixture<ProductCategoryTile>(html`
            <relewise-product-category-tile .productCategory=${category}></relewise-product-category-tile>
        `);
        await element.updateComplete;

        assert.instanceOf(element, ProductCategoryTile);
        assert.strictEqual(element.productCategory, category);
        assert.exists(element.shadowRoot);
        assert.equal(element.shadowRoot!.querySelector<HTMLAnchorElement>('[part="link"]')?.getAttribute('href'), '/product-category');
        assert.equal(element.shadowRoot!.querySelector<HTMLImageElement>('[part="image"]')?.getAttribute('src'), imageUrl);
        assert.equal(element.shadowRoot!.querySelector('[part="display-name"]')?.textContent, 'Product category');
        assert.exists(element.shadowRoot!.querySelector('[part="image-container"]'));
        assert.exists(element.shadowRoot!.querySelector('[part="information"]'));
    });

    test('registers and renders the content category contract through useSearch', async() => {
        initializeRelewiseUI(mockRelewiseOptions()).useSearch();
        const category = contentCategory();
        const element = await fixture<ContentCategoryTile>(html`
            <relewise-content-category-tile .contentCategory=${category}></relewise-content-category-tile>
        `);
        await element.updateComplete;

        assert.instanceOf(element, ContentCategoryTile);
        assert.strictEqual(element.contentCategory, category);
        assert.exists(element.shadowRoot!.querySelector('[part="container"]'));
        assert.equal(element.shadowRoot!.querySelector<HTMLImageElement>('[part="image"]')?.getAttribute('src'), imageUrl);
        assert.equal(element.shadowRoot!.querySelector('[part="display-name"]')?.textContent, 'Content category');
    });

    test('uses the product category custom template and suppresses default styles', async() => {
        const options = mockRelewiseOptions();
        options.templates = {
            productCategory: (category, { html, helpers }) => html`
                <span class="custom-product-category">${category.displayName}-${helpers.user?.temporaryId ?? 'anonymous'}</span>
            `,
        };
        initializeRelewiseUI(options).useRecommendations();
        const element = await fixture<ProductCategoryTile>(html`
            <relewise-product-category-tile .productCategory=${productCategory()}></relewise-product-category-tile>
        `);
        await element.updateComplete;

        assert.equal(element.shadowRoot!.querySelector('.custom-product-category')?.textContent, 'Product category-anonymous');
        assert.lengthOf(element.shadowRoot!.adoptedStyleSheets, 0);
    });

    test('uses the content category custom template in Light DOM without default styles', async() => {
        const options = mockRelewiseOptions();
        options.components = { domMode: 'light' };
        options.templates = {
            contentCategory: (category, { html }) => html`<span class="custom-content-category">${category.displayName}</span>`,
        };
        initializeRelewiseUI(options).useRecommendations();
        const element = await fixture<ContentCategoryTile>(html`
            <relewise-content-category-tile .contentCategory=${contentCategory()}></relewise-content-category-tile>
        `);
        await element.updateComplete;

        assert.equal(element.renderRoot, element);
        assert.equal(element.querySelector('.custom-content-category')?.textContent, 'Content category');
        assert.notInclude(document.querySelector('#relewise-light-dom-styles')?.textContent ?? '', 'relewise-content-category-tile .rw-category-tile');
    });

    test('product category removes hidden when a later synchronous template is visible', async() => {
        let visible = false;
        const options = mockRelewiseOptions();
        options.templates = {
            productCategory: (_category, { html, helpers }) => visible ? html`<span>Visible</span>` : helpers.nothing,
        };
        initializeRelewiseUI(options).useRecommendations();
        const element = await fixture<ProductCategoryTile>(html`
            <relewise-product-category-tile .productCategory=${productCategory()}></relewise-product-category-tile>
        `);
        await element.updateComplete;
        assert.isTrue(element.hidden);

        visible = true;
        element.requestUpdate();
        await element.updateComplete;

        assert.isFalse(element.hidden);
        assert.equal(element.shadowRoot!.textContent?.trim(), 'Visible');
    });

    test('content category removes hidden when a later synchronous template is visible', async() => {
        let visible = false;
        const options = mockRelewiseOptions();
        options.templates = {
            contentCategory: (_category, { html, helpers }) => visible ? html`<span>Visible</span>` : helpers.nothing,
        };
        initializeRelewiseUI(options).useRecommendations();
        const element = await fixture<ContentCategoryTile>(html`
            <relewise-content-category-tile .contentCategory=${contentCategory()}></relewise-content-category-tile>
        `);
        await element.updateComplete;
        assert.isTrue(element.hidden);

        visible = true;
        element.requestUpdate();
        await element.updateComplete;

        assert.isFalse(element.hidden);
        assert.equal(element.shadowRoot!.textContent?.trim(), 'Visible');
    });

    test('stale asynchronous product category result cannot hide newer content', async() => {
        let resolveOld!: (result: TemplateResult<1> | typeof nothing) => void;
        const oldResult = new Promise<TemplateResult<1> | typeof nothing>(resolve => resolveOld = resolve);
        const options = mockRelewiseOptions();
        options.templates = {
            productCategory: (category, { html }) => category.categoryId === 'old' ? oldResult : html`<span>New product category</span>`,
        };
        initializeRelewiseUI(options).useRecommendations();
        const element = await fixture<ProductCategoryTile>(html`
            <relewise-product-category-tile .productCategory=${productCategory('old')}></relewise-product-category-tile>
        `);
        await element.updateComplete;

        element.productCategory = productCategory('new');
        await element.updateComplete;
        resolveOld(nothing);
        await new Promise(resolve => setTimeout(resolve, 0));

        assert.isFalse(element.hidden);
        assert.equal(element.shadowRoot!.textContent?.trim(), 'New product category');
    });

    test('stale asynchronous content category result cannot hide newer content', async() => {
        let resolveOld!: (result: TemplateResult<1> | typeof nothing) => void;
        const oldResult = new Promise<TemplateResult<1> | typeof nothing>(resolve => resolveOld = resolve);
        const options = mockRelewiseOptions();
        options.templates = {
            contentCategory: (category, { html }) => category.categoryId === 'old' ? oldResult : html`<span>New content category</span>`,
        };
        initializeRelewiseUI(options).useRecommendations();
        const element = await fixture<ContentCategoryTile>(html`
            <relewise-content-category-tile .contentCategory=${contentCategory('old')}></relewise-content-category-tile>
        `);
        await element.updateComplete;

        element.contentCategory = contentCategory('new');
        await element.updateComplete;
        resolveOld(nothing);
        await new Promise(resolve => setTimeout(resolve, 0));

        assert.isFalse(element.hidden);
        assert.equal(element.shadowRoot!.textContent?.trim(), 'New content category');
    });
});
