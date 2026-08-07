import { assert, fixture, html } from '@open-wc/testing';
import { initializeRelewiseUI, ProductSearchOverlay } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('product search overlay', () => {
    setup(() => {
        initializeRelewiseUI(mockRelewiseOptions()).useSearch();
    });

    test('keeps results open when the search input blurs after touching the overlay', async() => {
        const el = await fixture<ProductSearchOverlay>(html`<relewise-product-search-overlay></relewise-product-search-overlay>`);

        el.term = 'shoe';
        el.hasCompletedSearchRequest = true;
        el.results = [{ searchTermPrediction: { term: 'shoes' } as any }];
        el.searchBarInFocus = true;
        await el.updateComplete;

        const results = el.shadowRoot!.querySelector('relewise-product-search-overlay-results')!;
        await (results as HTMLElement & { updateComplete: Promise<boolean> }).updateComplete;
        results.shadowRoot!.querySelector('.rw-result-container')!.dispatchEvent(new Event('touchstart', { bubbles: true, composed: true }));
        el.setSearchBarInFocus(false);
        await new Promise(resolve => setTimeout(resolve, 0));
        await el.updateComplete;

        assert.exists(el.shadowRoot!.querySelector('relewise-product-search-overlay-results'));
    });

    test('closes results after touching outside the overlay', async() => {
        const el = await fixture<ProductSearchOverlay>(html`<relewise-product-search-overlay></relewise-product-search-overlay>`);

        el.term = 'shoe';
        el.hasCompletedSearchRequest = true;
        el.results = [{ searchTermPrediction: { term: 'shoes' } as any }];
        el.searchBarInFocus = true;
        el.resultBoxIsHovered = true;
        await el.updateComplete;

        document.body.dispatchEvent(new Event('touchstart', { bubbles: true, composed: true }));
        await el.updateComplete;

        assert.notExists(el.shadowRoot!.querySelector('relewise-product-search-overlay-results'));
    });

    test('reopens existing results when touching the search bar after touching outside', async() => {
        const el = await fixture<ProductSearchOverlay>(html`<relewise-product-search-overlay></relewise-product-search-overlay>`);

        el.term = 'shoe';
        el.hasCompletedSearchRequest = true;
        el.results = [{ searchTermPrediction: { term: 'shoes' } as any }];
        el.searchBarInFocus = true;
        await el.updateComplete;

        document.body.dispatchEvent(new Event('touchstart', { bubbles: true, composed: true }));
        await el.updateComplete;

        const searchBar = el.shadowRoot!.querySelector('relewise-search-bar')!;
        await (searchBar as HTMLElement & { updateComplete: Promise<boolean> }).updateComplete;
        searchBar.shadowRoot!.querySelector('.rw-search-bar')!.dispatchEvent(new Event('touchstart', { bubbles: true, composed: true }));
        await el.updateComplete;

        assert.exists(el.shadowRoot!.querySelector('relewise-product-search-overlay-results'));
    });

    test('does not close results from a pending blur after focus returns', async() => {
        const el = await fixture<ProductSearchOverlay>(html`<relewise-product-search-overlay></relewise-product-search-overlay>`);

        el.term = 'shoe';
        el.hasCompletedSearchRequest = true;
        el.results = [{ searchTermPrediction: { term: 'shoes' } as any }];
        el.searchBarInFocus = true;
        await el.updateComplete;

        el.setSearchBarInFocus(false);
        el.setSearchBarInFocus(true);
        await new Promise(resolve => setTimeout(resolve, 0));
        await el.updateComplete;

        assert.exists(el.shadowRoot!.querySelector('relewise-product-search-overlay-results'));
    });

    test('closes the search keyboard when touching and scrolling results', async() => {
        const el = await fixture<ProductSearchOverlay>(html`<relewise-product-search-overlay></relewise-product-search-overlay>`);

        el.term = 'shoe';
        el.hasCompletedSearchRequest = true;
        el.results = [{ searchTermPrediction: { term: 'shoes' } as any }];
        el.searchBarInFocus = true;
        await el.updateComplete;

        const searchBar = el.shadowRoot!.querySelector('relewise-search-bar')!;
        let blurCalls = 0;
        searchBar.blurSearchInput = () => blurCalls++;

        const results = el.shadowRoot!.querySelector('relewise-product-search-overlay-results')!;
        await (results as HTMLElement & { updateComplete: Promise<boolean> }).updateComplete;
        results.shadowRoot!.querySelector('.rw-result-container')!.dispatchEvent(new Event('touchmove', { bubbles: true, composed: true }));
        await el.updateComplete;

        assert.equal(blurCalls, 1);
        assert.exists(el.shadowRoot!.querySelector('relewise-product-search-overlay-results'));
    });

    test('closes results and blurs input on Escape', async() => {
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

    test('closes the search keyboard when touching and scrolling light DOM results', async() => {
        const options = mockRelewiseOptions();
        options.components = {
            domMode: 'light',
        };
        initializeRelewiseUI(options).useSearch();
        const el = await fixture<ProductSearchOverlay>(html`<relewise-product-search-overlay></relewise-product-search-overlay>`);

        el.term = 'shoe';
        el.hasCompletedSearchRequest = true;
        el.results = [{ searchTermPrediction: { term: 'shoes' } as any }];
        el.searchBarInFocus = true;
        await el.updateComplete;

        const searchBar = el.querySelector('relewise-search-bar')!;
        let blurCalls = 0;
        searchBar.blurSearchInput = () => blurCalls++;

        const results = el.querySelector('relewise-product-search-overlay-results')!;
        await (results as HTMLElement & { updateComplete: Promise<boolean> }).updateComplete;
        results.querySelector('.rw-result-container')!.dispatchEvent(new Event('touchmove', { bubbles: true, composed: true }));
        await el.updateComplete;

        assert.equal(blurCalls, 1);
        assert.exists(el.querySelector('relewise-product-search-overlay-results'));
    });
});
