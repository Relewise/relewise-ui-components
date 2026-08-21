import { assert, fixture, fixtureCleanup, html } from '@open-wc/testing';
import { initializeRelewiseUI, UniversalSearch, useSearch } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

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
