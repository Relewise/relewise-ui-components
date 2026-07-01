import { assert, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import { clearUrlState, FullSearch, QueryKeys, readCurrentUrlState, updateUrlState, useSearch } from '../src';

suite('relewise-full-search', () => {
    setup(() => {
        clearUrlState();
        useSearch({ debounceTimeInMs: 0, fullSearch: {} });
    });

    teardown(() => {
        clearUrlState();
        fixtureCleanup();
        window.relewiseUISearchOptions = undefined!;
    });

    test('is registered through useSearch', () => {
        assert.isDefined(customElements.get('relewise-full-search'));
    });

    test('prefills term from URL without opening', async () => {
        updateUrlState(QueryKeys.term, 'shoe');

        const el = await fixture(html`
            <relewise-full-search displayed-at-location="Full Search"></relewise-full-search>
        `) as FullSearch;

        assert.equal(el.term, 'shoe');
        assert.isFalse(el.isOpen);
        assert.isFalse(el.hasAttribute('open'));
    });

    test('opens and closes through methods', async () => {
        const el = await fixture(html`
            <relewise-full-search displayed-at-location="Full Search"></relewise-full-search>
        `) as FullSearch;

        el.open();
        await el.updateComplete;

        assert.isTrue(el.isOpen);
        assert.isTrue(el.hasAttribute('open'));
        assert.isNotNull(el.shadowRoot!.querySelector('[role="dialog"]'));

        el.close();
        await el.updateComplete;

        assert.isFalse(el.isOpen);
        assert.isFalse(el.hasAttribute('open'));
        assert.isNull(el.shadowRoot!.querySelector('[role="dialog"]'));
    });

    test('opens through the open attribute', async () => {
        const el = await fixture(html`
            <relewise-full-search displayed-at-location="Full Search" open></relewise-full-search>
        `) as FullSearch;

        assert.isTrue(el.isOpen);
        assert.isNotNull(el.shadowRoot!.querySelector('[role="dialog"]'));
    });

    test('uses full-search localization', async () => {
        useSearch({
            debounceTimeInMs: 0,
            fullSearch: {},
            localization: {
                fullSearch: {
                    close: 'Luk',
                    emptyState: 'Begynd at søge.',
                },
            },
        });

        const el = await fixture(html`
            <relewise-full-search displayed-at-location="Full Search" open></relewise-full-search>
        `) as FullSearch;

        const closeButton = el.shadowRoot!.querySelector('relewise-button[part="close-button"]');
        const emptyState = el.shadowRoot!.querySelector('[part="empty-state"]');

        assert.equal(closeButton?.getAttribute('button-text'), 'Luk');
        assert.equal(emptyState?.textContent?.trim(), 'Begynd at søge.');
    });

    test('closes on Escape', async () => {
        const el = await fixture(html`
            <relewise-full-search displayed-at-location="Full Search" open></relewise-full-search>
        `) as FullSearch;

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        await el.updateComplete;

        assert.isFalse(el.isOpen);
    });

    test('writes term to URL state', async () => {
        const el = await fixture(html`
            <relewise-full-search displayed-at-location="Full Search" open></relewise-full-search>
        `) as FullSearch;

        el.setSearchTerm('shoe');

        await waitUntil(() => readCurrentUrlState(QueryKeys.term) === 'shoe', 'term was not written to URL state');
    });
});
