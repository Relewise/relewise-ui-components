import { assert, fixture, html } from '@open-wc/testing';
import { initializeRelewiseUI, ProductSearchOverlay } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('product search overlay', () => {
    setup(() => {
        initializeRelewiseUI(mockRelewiseOptions()).useSearch();
    });

    test('closes results on Escape', async() => {
        const el = await fixture<ProductSearchOverlay>(html`<relewise-product-search-overlay></relewise-product-search-overlay>`);

        el.term = 'shoe';
        el.hasCompletedSearchRequest = true;
        el.results = [{ searchTermPrediction: { term: 'shoes' } as any }];
        el.searchBarInFocus = true;
        await el.updateComplete;

        const searchBar = el.shadowRoot!.querySelector('relewise-search-bar')!;
        await searchBar.updateComplete;
        const input = searchBar.shadowRoot!.querySelector('input')!;
        input.focus();

        const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
        el.handleKeyDown(event);
        await el.updateComplete;

        assert.isTrue(event.defaultPrevented);
        assert.notEqual(searchBar.shadowRoot!.activeElement, input);
        assert.notExists(el.shadowRoot!.querySelector('relewise-product-search-overlay-results'));
    });

    test('reopens results after Escape when the input receives focus again', async() => {
        const el = await fixture<ProductSearchOverlay>(html`<relewise-product-search-overlay></relewise-product-search-overlay>`);

        el.term = 'shoe';
        el.hasCompletedSearchRequest = true;
        el.results = [{ searchTermPrediction: { term: 'shoes' } as any }];
        el.searchBarInFocus = true;
        await el.updateComplete;

        el.handleKeyDown(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
        await el.updateComplete;

        const searchBar = el.shadowRoot!.querySelector('relewise-search-bar')!;
        await searchBar.updateComplete;
        searchBar.shadowRoot!.querySelector('input')!.focus();
        await el.updateComplete;

        assert.exists(el.shadowRoot!.querySelector('relewise-product-search-overlay-results'));
    });

    test('closes no-results overlay on Escape', async() => {
        const el = await fixture<ProductSearchOverlay>(html`<relewise-product-search-overlay></relewise-product-search-overlay>`);

        el.term = 'shoe';
        el.hasCompletedSearchRequest = true;
        el.results = null;
        el.searchBarInFocus = true;
        await el.updateComplete;

        const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
        el.handleKeyDown(event);
        await el.updateComplete;

        assert.isTrue(event.defaultPrevented);
        assert.notExists(el.shadowRoot!.querySelector('relewise-product-search-overlay-results'));
    });
});
