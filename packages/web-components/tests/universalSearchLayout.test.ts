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
                    --relewise-universal-search-mobile-search-width: 20rem;
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
        const bodyChild = element.renderRoot.querySelector<HTMLElement>('[part="body"] > *')!;

        assert.equal(dialog.getBoundingClientRect().width, 480);
        assert.equal(getComputedStyle(header).flexDirection, 'row');
        assert.closeTo(search.getBoundingClientRect().top, close.getBoundingClientRect().top, 1);
        assert.isBelow(search.getBoundingClientRect().right, close.getBoundingClientRect().left);
        assert.equal(bodyChild.getBoundingClientRect().width, 288);
        assert.isAtMost(dialog.scrollWidth, dialog.clientWidth);
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
