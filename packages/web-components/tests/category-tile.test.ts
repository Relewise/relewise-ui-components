import { assert, fixture, fixtureCleanup, html } from '@open-wc/testing';
import { ContentCategoryResult, ProductCategoryResult } from '@relewise/client';
import {
    ContentCategoryTile,
    initializeRelewiseUI,
    ProductCategoryTile,
} from '../src';
import { clearRegisteredLightDomStylesForTesting } from '../src/lightDomStyles';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

const imageUrl = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

function productCategory(categoryId = 'product-category', image: string | null = imageUrl): ProductCategoryResult {
    return {
        categoryId,
        displayName: 'Product category',
        rank: 1,
        data: {
            Url: { type: 'String', isCollection: false, value: '/product-category' },
            ...(image ? { ImageUrl: { type: 'String', isCollection: false, value: image } } : {}),
        },
    } as unknown as ProductCategoryResult;
}

function contentCategory(categoryId = 'content-category', image: string | null = imageUrl): ContentCategoryResult {
    return {
        categoryId,
        displayName: 'Content category',
        rank: 1,
        data: {
            ...(image ? { ImageUrl: { type: 'String', isCollection: false, value: image } } : {}),
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
        assert.equal(element.shadowRoot!.querySelector<HTMLImageElement>('[part="image"]')?.getAttribute('alt'), '');
        const displayName = element.shadowRoot!.querySelector('[part="display-name"]')!;
        assert.equal(displayName.textContent, 'Product category');
        assert.equal(displayName.tagName, 'H5');
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
        assert.equal(element.shadowRoot!.querySelector<HTMLImageElement>('[part="image"]')?.getAttribute('alt'), '');
        const displayName = element.shadowRoot!.querySelector('[part="display-name"]')!;
        assert.equal(displayName.textContent, 'Content category');
        assert.equal(displayName.tagName, 'H5');
    });

    test('keeps default category tile markup compatible in Light DOM', async() => {
        const options = mockRelewiseOptions();
        options.components = { domMode: 'light' };
        const app = initializeRelewiseUI(options);
        app.useRecommendations();
        app.useSearch();
        const wrapper = await fixture<HTMLElement>(html`
            <div>
                <relewise-product-category-tile .productCategory=${productCategory()}></relewise-product-category-tile>
                <relewise-content-category-tile .contentCategory=${contentCategory()}></relewise-content-category-tile>
            </div>
        `);
        const elements = [
            wrapper.querySelector<ProductCategoryTile>('relewise-product-category-tile')!,
            wrapper.querySelector<ContentCategoryTile>('relewise-content-category-tile')!,
        ];

        for (const element of elements) {
            await element.updateComplete;
            assert.equal(element.querySelector('img')?.getAttribute('alt'), '');
            assert.equal(element.querySelector('[part="display-name"]')?.tagName, 'H5');
        }
    });

    test('applies display name alignment to both category tile types', async() => {
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const productElement = await fixture<ProductCategoryTile>(html`
            <relewise-product-category-tile
                style="--relewise-display-name-alignment: center"
                .productCategory=${productCategory()}>
            </relewise-product-category-tile>
        `);
        const contentElement = await fixture<ContentCategoryTile>(html`
            <relewise-content-category-tile
                style="--relewise-display-name-alignment: end"
                .contentCategory=${contentCategory()}>
            </relewise-content-category-tile>
        `);

        assert.equal(getComputedStyle(productElement.shadowRoot!.querySelector('[part="display-name"]')!).textAlign, 'center');
        assert.equal(getComputedStyle(contentElement.shadowRoot!.querySelector('[part="display-name"]')!).textAlign, 'end');
    });

    test('only reserves two display name lines for category tiles with images in Shadow DOM', async() => {
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const wrapper = await fixture<HTMLElement>(html`
            <div>
                <relewise-product-category-tile
                    style="--relewise-display-name-line-height: 20px"
                    .productCategory=${productCategory('product-with-image')}>
                </relewise-product-category-tile>
                <relewise-product-category-tile
                    style="--relewise-display-name-line-height: 20px"
                    .productCategory=${productCategory('product-without-image', null)}>
                </relewise-product-category-tile>
                <relewise-content-category-tile
                    style="--relewise-display-name-line-height: 20px"
                    .contentCategory=${contentCategory('content-with-image')}>
                </relewise-content-category-tile>
                <relewise-content-category-tile
                    style="--relewise-display-name-line-height: 20px"
                    .contentCategory=${contentCategory('content-without-image', null)}>
                </relewise-content-category-tile>
            </div>
        `);
        const elements = [...wrapper.children] as (ProductCategoryTile | ContentCategoryTile)[];

        await Promise.all(elements.map(element => element.updateComplete));

        for (const element of [elements[0], elements[2]]) {
            assert.equal(getComputedStyle(element.renderRoot.querySelector('[part="display-name"]')!).height, '40px');
        }

        for (const element of [elements[1], elements[3]]) {
            assert.notExists(element.renderRoot.querySelector('[part="image-container"]'));
            assert.equal(getComputedStyle(element.renderRoot.querySelector('[part="display-name"]')!).height, '20px');
        }
    });

    test('only reserves two display name lines for category tiles with images in Light DOM', async() => {
        const options = mockRelewiseOptions();
        options.components = { domMode: 'light' };
        initializeRelewiseUI(options).useRecommendations();
        const wrapper = await fixture<HTMLElement>(html`
            <div>
                <relewise-product-category-tile
                    style="--relewise-display-name-line-height: 20px"
                    .productCategory=${productCategory('product-with-image')}>
                </relewise-product-category-tile>
                <relewise-product-category-tile
                    style="--relewise-display-name-line-height: 20px"
                    .productCategory=${productCategory('product-without-image', null)}>
                </relewise-product-category-tile>
                <relewise-content-category-tile
                    style="--relewise-display-name-line-height: 20px"
                    .contentCategory=${contentCategory('content-with-image')}>
                </relewise-content-category-tile>
                <relewise-content-category-tile
                    style="--relewise-display-name-line-height: 20px"
                    .contentCategory=${contentCategory('content-without-image', null)}>
                </relewise-content-category-tile>
            </div>
        `);
        const elements = [...wrapper.children] as (ProductCategoryTile | ContentCategoryTile)[];

        await Promise.all(elements.map(element => element.updateComplete));

        for (const element of [elements[0], elements[2]]) {
            assert.equal(getComputedStyle(element.querySelector('[part="display-name"]')!).height, '40px');
        }

        for (const element of [elements[1], elements[3]]) {
            assert.notExists(element.querySelector('[part="image-container"]'));
            assert.equal(getComputedStyle(element.querySelector('[part="display-name"]')!).height, '20px');
        }
    });

    test('keeps cards aligned per row when an image appears in a later grid row', async() => {
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const wrapper = await fixture<HTMLElement>(html`
            <div style="display: grid; grid-template-columns: repeat(2, 10rem); gap: 1rem; --relewise-image-height: 6rem; --relewise-display-name-line-height: 20px;">
                <relewise-product-category-tile .productCategory=${productCategory('compact-one', null)}></relewise-product-category-tile>
                <relewise-product-category-tile .productCategory=${productCategory('compact-two', null)}></relewise-product-category-tile>
                <relewise-product-category-tile .productCategory=${productCategory('mixed-without-image', null)}></relewise-product-category-tile>
                <relewise-product-category-tile .productCategory=${productCategory('mixed-with-image')}></relewise-product-category-tile>
            </div>
        `);
        const elements = [...wrapper.children] as ProductCategoryTile[];

        await Promise.all(elements.map(element => element.updateComplete));

        const heights = elements.map(element => element.getBoundingClientRect().height);
        assert.equal(heights[0], heights[1]);
        assert.equal(heights[2], heights[3]);
        assert.isBelow(heights[0], heights[2]);
        assert.equal(getComputedStyle(elements[2].renderRoot.querySelector('[part="display-name"]')!).height, '20px');
        assert.equal(getComputedStyle(elements[3].renderRoot.querySelector('[part="display-name"]')!).height, '40px');
    });

    test('uses the product category custom template and suppresses default styles', async() => {
        const options = mockRelewiseOptions();
        options.templates = {
            productCategory: (category, { html }) => html`
                <span class="custom-product-category">${category.displayName}</span>
            `,
        };
        initializeRelewiseUI(options).useRecommendations();
        const element = await fixture<ProductCategoryTile>(html`
            <relewise-product-category-tile .productCategory=${productCategory()}></relewise-product-category-tile>
        `);
        await element.updateComplete;

        assert.equal(element.shadowRoot!.querySelector('.custom-product-category')?.textContent, 'Product category');
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

});
