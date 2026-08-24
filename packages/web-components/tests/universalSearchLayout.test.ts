import { assert, fixture, fixtureCleanup, html } from '@open-wc/testing';
import type { ProductFacetResult } from '@relewise/client';
import { initializeRelewiseUI, UniversalSearch, useSearch } from '../src';
import type { UniversalSearchFacets } from '../src/search/universal-search-facets';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

function facetResult(): ProductFacetResult {
    return {
        items: [{
            '$type': 'Relewise.Client.DataTypes.Search.Facets.Result.ProductDataStringValueFacetResult, Relewise.Client',
            field: 'Data',
            key: 'Color',
            available: [{
                value: 'Blue',
                hits: 1,
                selected: false,
            }],
        }],
    } as ProductFacetResult;
}

suite('universal search layout', () => {
    setup(() => {
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ universalSearch: {} });
    });

    teardown(() => {
        fixtureCleanup();
        window.relewiseUISearchOptions = undefined!;
        window.relewiseUIOptions = undefined!;
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
        const input = search.renderRoot.querySelector<HTMLInputElement>('[part="search-input"]')!;

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

        const facets = productsTab.renderRoot.querySelector<UniversalSearchFacets>('relewise-universal-search-facets')!;
        facets.renderRoot.querySelector<HTMLButtonElement>('.rw-trigger')!.click();
        await facets.updateComplete;
        await element.updateComplete;
        await new Promise(requestAnimationFrame);

        const dialog = element.renderRoot.querySelector<HTMLElement>('[part="dialog"]')!;
        const drawer = facets.renderRoot.querySelector<HTMLElement>('.rw-drawer')!;
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
});
