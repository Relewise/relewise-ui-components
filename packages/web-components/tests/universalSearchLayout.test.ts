import { assert, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import { Searcher } from '@relewise/client';
import type { ProductFacetResult } from '@relewise/client';
import { initializeRelewiseUI, UniversalSearch, useSearch } from '../src';
import type { UniversalSearchFacets } from '../src/search/universal-search/components/facets';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

function facetResult(): ProductFacetResult {
    return {
        items: [{
            '$type': 'Relewise.Client.DataTypes.Search.Facets.Result.ProductDataStringValueFacetResult, Relewise.Client',
            field: 'Data',
            key: 'Color',
            available: ['Blue', 'Red'].map(value => ({
                value,
                hits: 1,
                selected: false,
            })),
        }],
    } as ProductFacetResult;
}

suite('universal search layout', () => {
    const originalBatch = Searcher.prototype.batch;

    setup(() => {
        Searcher.prototype.batch = originalBatch;
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ universalSearch: {} });
    });

    teardown(() => {
        fixtureCleanup();
        window.relewiseUISearchOptions = undefined!;
        window.relewiseUIOptions = undefined!;
        Searcher.prototype.batch = originalBatch;
    });

    test('uses the configured compact widths when the dialog container is narrow', async () => {
        const element = await fixture<UniversalSearch>(html`
            <relewise-universal-search
                open
                style="
                    --relewise-universal-search-width: 30rem;
                    --relewise-universal-search-search-width: 28rem;
                    --relewise-universal-search-mobile-search-width: 100%;
                    --relewise-universal-search-layout-width: 26rem;
                    --relewise-universal-search-mobile-layout-width: 18rem;
                ">
            </relewise-universal-search>
        `);
        await element.updateComplete;
        await new Promise(requestAnimationFrame);

        const dialog = element.renderRoot.querySelector<HTMLElement>('[part="dialog"]')!;
        const header = element.renderRoot.querySelector<HTMLElement>('[part="header"]')!;
        const search = element.renderRoot.querySelector<HTMLElement>('relewise-search-combobox')!;
        const close = element.renderRoot.querySelector<HTMLElement>('[part="close-button"]')!;
        const searchControl = (search as any).renderRoot.querySelector('[part="search-input"]') as HTMLElement;
        const closeControl = (close as any).renderRoot.querySelector('button') as HTMLElement;
        const bodyChild = element.renderRoot.querySelector<HTMLElement>('[part="body"] > *')!;
        const dialogBounds = dialog.getBoundingClientRect();
        const searchBounds = searchControl.getBoundingClientRect();
        const closeBounds = closeControl.getBoundingClientRect();

        assert.equal(dialogBounds.width, 480);
        assert.equal(getComputedStyle(header).flexDirection, 'row');
        assert.closeTo(searchBounds.top, closeBounds.top, 1);
        assert.closeTo(searchBounds.left - dialogBounds.left, closeBounds.left - searchBounds.right, 1);
        assert.closeTo(closeBounds.left - searchBounds.right, dialogBounds.right - closeBounds.right, 1);
        assert.equal(bodyChild.getBoundingClientRect().width, 288);
        assert.isAtMost(dialog.scrollWidth, dialog.clientWidth);
    });

    test('keeps configured dialog margins inside the viewport', async () => {
        const element = await fixture<UniversalSearch>(html`
            <relewise-universal-search
                open
                style="--relewise-universal-search-dialog-margin: 20px 30px;">
            </relewise-universal-search>
        `);
        await element.updateComplete;
        await new Promise(requestAnimationFrame);

        const backdrop = element.renderRoot.querySelector<HTMLElement>('[part="backdrop"]')!;
        const dialog = element.renderRoot.querySelector<HTMLElement>('[part="dialog"]')!;
        const backdropBounds = backdrop.getBoundingClientRect();
        const dialogBounds = dialog.getBoundingClientRect();

        assert.closeTo(dialogBounds.top - backdropBounds.top, 20, 1);
        assert.closeTo(backdropBounds.bottom - dialogBounds.bottom, 20, 1);
        assert.closeTo(dialogBounds.left - backdropBounds.left, 30, 1);
        assert.closeTo(backdropBounds.right - dialogBounds.right, 30, 1);
    });

    test('balances the visible header controls throughout the compact range', async () => {
        const element = await fixture<UniversalSearch>(html`
            <relewise-universal-search
                open
                style="
                    --relewise-universal-search-width: 50rem;
                    --relewise-universal-search-mobile-header-spacing: 10px;
                ">
            </relewise-universal-search>
        `);
        await element.updateComplete;
        await new Promise(requestAnimationFrame);

        const dialog = element.renderRoot.querySelector<HTMLElement>('[part="dialog"]')!;
        const search = element.renderRoot.querySelector<any>('relewise-search-combobox')!;
        const close = element.renderRoot.querySelector<any>('[part="close-button"]')!;
        const searchControl = search.renderRoot.querySelector('[part="search-input"]') as HTMLElement;
        const closeControl = close.renderRoot.querySelector('button') as HTMLElement;
        const dialogBounds = dialog.getBoundingClientRect();
        const searchBounds = searchControl.getBoundingClientRect();
        const closeBounds = closeControl.getBoundingClientRect();
        const leftSpacing = searchBounds.left - dialogBounds.left;
        const controlSpacing = closeBounds.left - searchBounds.right;
        const rightSpacing = dialogBounds.right - closeBounds.right;

        assert.closeTo(leftSpacing, 10, 1);
        assert.closeTo(leftSpacing, controlSpacing, 1);
        assert.closeTo(controlSpacing, rightSpacing, 1);
    });

    test('uses the Universal Search foreground color for the input placeholder', async () => {
        const element = await fixture<UniversalSearch>(html`
            <relewise-universal-search
                open
                style="--relewise-universal-search-color: rgb(30 40 50);">
            </relewise-universal-search>
        `);
        await element.updateComplete;

        const dialog = element.renderRoot.querySelector<HTMLElement>('[part="dialog"]')!;
        const search = element.renderRoot.querySelector<any>('relewise-search-combobox')!;
        await search.updateComplete;
        const input = search.renderRoot.querySelector('[part="search-input"]') as HTMLInputElement;

        assert.equal(getComputedStyle(search).getPropertyValue('--color').trim(), 'rgb(30 40 50)');
        assert.notEqual(getComputedStyle(input, '::placeholder').color, 'rgb(238, 238, 238)');
        assert.equal(getComputedStyle(dialog).color, 'rgb(30, 40, 50)');
    });

    test('balances visible desktop controls and keeps the result summary left-aligned', async () => {
        const element = await fixture<UniversalSearch>(html`
            <relewise-universal-search
                open
                style="--relewise-universal-search-header-gap: 14px;">
            </relewise-universal-search>
        `);
        await element.updateComplete;

        const dialog = element.renderRoot.querySelector<HTMLElement>('[part="dialog"]')!;
        dialog.style.flex = 'none';
        dialog.style.width = '70rem';
        (element as any).term = 'shoe';
        (element as any).activeTab = 'products';
        element.requestUpdate();
        await element.updateComplete;
        await new Promise(requestAnimationFrame);

        const search = element.renderRoot.querySelector<any>('relewise-search-combobox')!;
        const close = element.renderRoot.querySelector<any>('[part="close-button"]')!;
        const searchControl = search.renderRoot.querySelector('[part="search-input"]') as HTMLElement;
        const closeControl = close.renderRoot.querySelector('button') as HTMLElement;
        const resultsSummary = element.renderRoot.querySelector<HTMLElement>('[part="results-summary"]')!;
        const dialogBounds = dialog.getBoundingClientRect();
        const searchBounds = searchControl.getBoundingClientRect();
        const closeBounds = closeControl.getBoundingClientRect();
        const leftSpacing = searchBounds.left - dialogBounds.left;
        const controlSpacing = closeBounds.left - searchBounds.right;
        const rightSpacing = dialogBounds.right - closeBounds.right;

        assert.isAtLeast(dialogBounds.width, 1024);
        assert.closeTo(leftSpacing, 14, 1);
        assert.closeTo(leftSpacing, controlSpacing, 1);
        assert.closeTo(controlSpacing, rightSpacing, 1);
        assert.equal(getComputedStyle(resultsSummary).textAlign, 'start');
        assert.equal(getComputedStyle(resultsSummary).marginTop, '0px');
    });

    test('wraps compact tabs instead of introducing horizontal scrolling', async () => {
        const element = await fixture<UniversalSearch>(html`
            <relewise-universal-search
                open
                style="--relewise-universal-search-width: 20rem;">
            </relewise-universal-search>
        `);
        (element as any).term = 'shoe';
        (element as any).activeTab = 'products';
        element.requestUpdate();
        await element.updateComplete;
        await new Promise(requestAnimationFrame);

        const tabs = element.renderRoot.querySelector<HTMLElement>('[part="tabs"]')!;
        const tabButtons = [...tabs.querySelectorAll<HTMLElement>('[part~="tab"]')];
        const tabsBounds = tabs.getBoundingClientRect();
        const styles = getComputedStyle(tabs);

        assert.equal(styles.flexWrap, 'wrap');
        assert.notEqual(styles.overflowX, 'auto');
        assert.isAtMost(tabs.scrollWidth, tabs.clientWidth);
        tabButtons.forEach(tab => {
            const bounds = tab.getBoundingClientRect();
            assert.isAtLeast(bounds.left, tabsBounds.left - 1);
            assert.isAtMost(bounds.right, tabsBounds.right + 1);
        });
    });

    test('covers the entire compact dialog with the facets drawer', async () => {
        const element = await fixture<UniversalSearch>(html`
            <relewise-universal-search
                open
                style="--relewise-universal-search-width: 30rem;">
            </relewise-universal-search>
        `);
        (element as any).term = 'shoe';
        (element as any).activeTab = 'products';
        element.requestUpdate();
        await element.updateComplete;

        const productsTab = element.renderRoot.querySelector<any>('relewise-universal-search-products-tab')!;
        productsTab.result = {
            hits: 1,
            results: [],
            facets: facetResult(),
        };
        productsTab.facetLabels = ['Color'];
        productsTab.requestUpdate();
        await productsTab.updateComplete;

        const facets = productsTab.renderRoot.querySelector('relewise-universal-search-facets') as UniversalSearchFacets;
        (facets.renderRoot.querySelector('.rw-trigger') as HTMLButtonElement).click();
        await facets.updateComplete;
        await element.updateComplete;
        await new Promise(requestAnimationFrame);

        const dialog = element.renderRoot.querySelector<HTMLElement>('[part="dialog"]')!;
        const drawer = facets.renderRoot.querySelector('.rw-drawer') as HTMLElement;
        const dialogBounds = dialog.getBoundingClientRect();
        const drawerBounds = drawer.getBoundingClientRect();

        assert.closeTo(drawerBounds.top, dialogBounds.top, 1);
        assert.closeTo(drawerBounds.right, dialogBounds.right, 1);
        assert.closeTo(drawerBounds.bottom, dialogBounds.bottom, 1);
        assert.closeTo(drawerBounds.left, dialogBounds.left, 1);
    });

    test('registers container-query styles in Light DOM', async () => {
        const options = mockRelewiseOptions();
        options.components = { domMode: 'light' };
        initializeRelewiseUI(options);
        useSearch({ universalSearch: {} });

        await fixture<UniversalSearch>(html`
            <relewise-universal-search open></relewise-universal-search>
        `);

        const styles = document.querySelector('#relewise-light-dom-styles')?.textContent ?? '';
        assert.include(styles, '@container universal-search-dialog (width < 64rem)');
        assert.include(styles, 'relewise-universal-search .rw-body > *');
        assert.include(styles, '--relewise-universal-search-mobile-layout-width');
    });

    test('shows an error instead of leaving tabs loading when the batch returns no response', async() => {
        Searcher.prototype.batch = async function() {
            return undefined;
        };
        useSearch({ debounceTimeInMs: 0, universalSearch: { entities: { products: {} } } });

        const element = await fixture<UniversalSearch>(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `);

        (element as any).setSearchTerm('shoe');
        await waitUntil(
            () => Boolean(element.renderRoot
                .querySelector<any>('relewise-universal-search-products-tab')
                ?.renderRoot.querySelector('[part="error-state"]')),
            'the product error state was not rendered',
        );

        const productsTab = element.renderRoot.querySelector<any>('relewise-universal-search-products-tab')!;
        assert.equal(
            productsTab.renderRoot.querySelector('[part="error-state"]')?.textContent,
            'Could not load products.',
        );
        assert.isNull(productsTab.renderRoot.querySelector('[part="loading-state"]'));
    });

    test('does not render entity headings before search responses arrive', async () => {
        const wrapper = await fixture<HTMLElement>(html`
            <div>
                <relewise-universal-search-products-tab term="shoe"></relewise-universal-search-products-tab>
                <relewise-universal-search-product-categories-tab term="shoe"></relewise-universal-search-product-categories-tab>
                <relewise-universal-search-content-tab term="shoe"></relewise-universal-search-content-tab>
            </div>
        `);
        const tabs = [
            wrapper.querySelector<any>('relewise-universal-search-products-tab')!,
            wrapper.querySelector<any>('relewise-universal-search-product-categories-tab')!,
            wrapper.querySelector<any>('relewise-universal-search-content-tab')!,
        ];
        await Promise.all(tabs.map(tab => tab.updateComplete));

        assert.isTrue(tabs.every(tab => tab.renderRoot.querySelector('[part="results-title"]') === null));

        tabs.forEach(tab => {
            tab.result = { hits: 1, facets: null };
        });
        await Promise.all(tabs.map(tab => tab.updateComplete));

        assert.deepEqual(
            tabs.map(tab => tab.renderRoot.querySelector('[part="results-title"]')?.textContent?.trim()),
            ['Products', 'Categories', 'Content'],
        );
    });

    test('does not reserve the facet rail for an unselected single option', async () => {
        const tab = await fixture<any>(html`
            <relewise-universal-search-products-tab term="shoe"></relewise-universal-search-products-tab>
        `);
        const facetResult = (selected: boolean) => ({
            items: [{
                $type: 'Relewise.Client.DataTypes.Search.Facets.Result.ProductDataStringValueFacetResult, Relewise.Client',
                field: 'Data',
                key: 'Category',
                available: [{
                    value: 'Shoes',
                    hits: 1,
                    selected,
                }],
            }],
        });

        tab.result = { hits: 1, facets: facetResult(false) };
        await tab.updateComplete;
        assert.isNull(tab.renderRoot.querySelector('relewise-universal-search-facets'));

        tab.result = { hits: 1, facets: facetResult(true) };
        await tab.updateComplete;
        assert.isNotNull(tab.renderRoot.querySelector('relewise-universal-search-facets'));
    });

});
