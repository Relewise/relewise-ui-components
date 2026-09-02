import { assert, fixture, fixtureCleanup, html } from '@open-wc/testing';
import {
    ContentCategoryResult,
    ContentResult,
    ProductCategoryResult,
    ProductResult,
} from '@relewise/client';
import { initializeRelewiseUI } from '../src';
import { clearRegisteredLightDomStylesForTesting } from '../src/lightDomStyles';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

function assertRoundedContentClipping(element: Element) {
    const hostStyles = getComputedStyle(element);
    assert.equal(hostStyles.borderTopStyle, 'solid');
    assert.equal(hostStyles.borderTopWidth, '1px');
    assert.equal(hostStyles.clipPath, 'none');
    assert.equal(hostStyles.overflow, 'visible');

    const innerTile = (element.shadowRoot ?? element).querySelector<HTMLElement>(
        '.rw-tile, .rw-content-tile, .rw-category-tile',
    );
    assert.exists(innerTile);

    const innerStyles = getComputedStyle(innerTile!);
    assert.notEqual(innerStyles.borderTopLeftRadius, '0px');
    assert.equal(innerStyles.clipPath, 'none');
    assert.equal(innerStyles.overflow, 'clip');
}

function assertTileRadius(element: Element, expectedRadius: string) {
    assert.equal(getComputedStyle(element).borderTopLeftRadius, expectedRadius);

    const innerTile = (element.shadowRoot ?? element).querySelector<HTMLElement>(
        '.rw-tile, .rw-content-tile, .rw-category-tile',
    );
    assert.exists(innerTile);
    assert.equal(getComputedStyle(innerTile!).borderTopLeftRadius, expectedRadius);
}

function assertContentClipping(element: Element, expectedOverflow: string) {
    const innerTile = (element.shadowRoot ?? element).querySelector<HTMLElement>(
        '.rw-tile, .rw-content-tile, .rw-category-tile',
    );
    assert.exists(innerTile);
    assert.equal(getComputedStyle(innerTile!).overflow, expectedOverflow);
}

function product(): ProductResult {
    return { productId: 'product', displayName: 'Product', data: {} } as unknown as ProductResult;
}

function content(): ContentResult {
    return { contentId: 'content', displayName: 'Content', data: {} } as unknown as ContentResult;
}

function productCategory(): ProductCategoryResult {
    return { categoryId: 'product-category', displayName: 'Product category' } as unknown as ProductCategoryResult;
}

function contentCategory(): ContentCategoryResult {
    return { categoryId: 'content-category', displayName: 'Content category' } as unknown as ContentCategoryResult;
}

suite('tile border rendering', () => {
    teardown(() => {
        fixtureCleanup();
        clearRegisteredLightDomStylesForTesting();
        window.relewiseUIOptions = undefined!;
    });

    for (const domMode of ['shadow', 'light'] as const) {
        test(`clips rounded tile contents without clipping borders in ${domMode} DOM`, async() => {
            const options = mockRelewiseOptions();
            options.components = { domMode };
            initializeRelewiseUI(options).useSearch();
            const container = await fixture<HTMLElement>(html`
                <div>
                    <relewise-product-tile .product=${product()}></relewise-product-tile>
                    <relewise-content-tile .content=${content()}></relewise-content-tile>
                    <relewise-product-category-tile .productCategory=${productCategory()}></relewise-product-category-tile>
                    <relewise-content-category-tile .contentCategory=${contentCategory()}></relewise-content-category-tile>
                </div>
            `);
            const tiles = Array.from(container.children);

            assert.lengthOf(tiles, 4);
            tiles.forEach(assertRoundedContentClipping);
        });

        test(`clamps negative inner tile radii to zero in ${domMode} DOM`, async() => {
            const options = mockRelewiseOptions();
            options.components = { domMode };
            initializeRelewiseUI(options).useSearch();
            const container = await fixture<HTMLElement>(html`
                <div>
                    <relewise-product-tile
                        style="--relewise-product-tile-border-radius: 0px"
                        .product=${product()}>
                    </relewise-product-tile>
                    <relewise-content-tile
                        style="--relewise-content-tile-border-radius: 0px"
                        .content=${content()}>
                    </relewise-content-tile>
                    <relewise-product-category-tile
                        style="--relewise-category-tile-border-radius: 0px"
                        .productCategory=${productCategory()}>
                    </relewise-product-category-tile>
                    <relewise-content-category-tile
                        style="--relewise-category-tile-border-radius: 0px"
                        .contentCategory=${contentCategory()}>
                    </relewise-content-category-tile>
                </div>
            `);
            const tiles = Array.from(container.children);

            assert.lengthOf(tiles, 4);
            tiles.forEach(tile => assertTileRadius(tile, '0px'));
        });

        test(`allows inner tile clipping to be disabled in ${domMode} DOM`, async() => {
            const options = mockRelewiseOptions();
            options.components = { domMode };
            initializeRelewiseUI(options).useSearch();
            const container = await fixture<HTMLElement>(html`
                <div style="--relewise-tile-overflow: visible">
                    <relewise-product-tile .product=${product()}></relewise-product-tile>
                    <relewise-content-tile .content=${content()}></relewise-content-tile>
                    <relewise-product-category-tile .productCategory=${productCategory()}></relewise-product-category-tile>
                    <relewise-content-category-tile .contentCategory=${contentCategory()}></relewise-content-category-tile>
                </div>
            `);
            const tiles = Array.from(container.children);

            assert.lengthOf(tiles, 4);
            tiles.forEach(tile => assertContentClipping(tile, 'visible'));
        });
    }
});
