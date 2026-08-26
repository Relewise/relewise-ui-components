import { assert, fixture, fixtureCleanup, html } from '@open-wc/testing';
import { ContentResult, ProductResult } from '@relewise/client';
import { ContentTile, initializeRelewiseUI, ProductTile } from '../src';
import { clearRegisteredLightDomStylesForTesting } from '../src/lightDomStyles';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

const imageUrl = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

function product(productId = 'product'): ProductResult {
    return {
        productId,
        displayName: productId,
        data: {
            Url: { type: 'String', isCollection: false, value: `/${productId}` },
            ImageUrl: { type: 'String', isCollection: false, value: imageUrl },
        },
    } as unknown as ProductResult;
}

function content(contentId = 'content'): ContentResult {
    return {
        contentId,
        displayName: contentId,
        data: {
            Url: { type: 'String', isCollection: false, value: `/${contentId}` },
            ImageUrl: { type: 'String', isCollection: false, value: imageUrl },
        },
    } as unknown as ContentResult;
}

suite('tile template visibility', () => {
    teardown(() => {
        clearRegisteredLightDomStylesForTesting();
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

    (['shadow', 'light'] as const).forEach(domMode => {
        test(`uses non-heading names and non-repetitive image alternatives in ${domMode} DOM`, async() => {
            const options = mockRelewiseOptions();
            options.components = { domMode };
            initializeRelewiseUI(options).useRecommendations();

            const wrapper = await fixture<HTMLElement>(html`
                <div>
                    <relewise-product-tile .product=${product()}></relewise-product-tile>
                    <relewise-content-tile .content=${content()}></relewise-content-tile>
                </div>
            `);
            const productElement = wrapper.querySelector<ProductTile>('relewise-product-tile')!;
            const contentElement = wrapper.querySelector<ContentTile>('relewise-content-tile')!;
            const productRoot = productElement.renderRoot;
            const contentRoot = contentElement.renderRoot;

            assert.equal(productRoot.querySelector('img')?.getAttribute('alt'), '');
            assert.equal(contentRoot.querySelector('img')?.getAttribute('alt'), '');
            assert.equal(productRoot.querySelector('.rw-display-name')?.tagName, 'DIV');
            assert.equal(contentRoot.querySelector('.rw-display-name')?.tagName, 'DIV');
            assert.isNull(productRoot.querySelector('h1, h2, h3, h4, h5, h6'));
            assert.isNull(contentRoot.querySelector('h1, h2, h3, h4, h5, h6'));

            const descriptiveVariant = product('variant-product');
            descriptiveVariant.variant = { displayName: 'Blue variant' } as ProductResult['variant'];
            productElement.product = descriptiveVariant;
            await productElement.updateComplete;

            assert.equal(productRoot.querySelector('img')?.getAttribute('alt'), 'Blue variant');
        });
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
