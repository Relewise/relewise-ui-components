import { assert, fixture, html } from '@open-wc/testing';
import { Searcher } from '@relewise/client';
import { initializeRelewiseUI, ProductSearchOverlay } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('product search overlay', () => {
    const originalBatch = Searcher.prototype.batch;

    setup(() => {
        initializeRelewiseUI(mockRelewiseOptions()).useSearch();
    });

    teardown(() => {
        Searcher.prototype.batch = originalBatch;
    });

    test('includes redirects with relative destinations in the results', async() => {
        Searcher.prototype.batch = async function() {
            return {
                responses: [
                    {
                        hits: 0,
                        results: [],
                        redirects: [
                            { destination: '/campaign', data: { Title: 'Campaign' } },
                            { destination: 'https://example.com/campaign', data: { Title: 'External campaign' } },
                            { destination: 'https://[invalid', data: { Title: 'Invalid' } },
                        ],
                    },
                    { $type: 'SearchTermPredictionResponse', predictions: [] },
                    { $type: 'ProductCategorySearchResponse', results: [] },
                ],
            } as any;
        };
        const el = await fixture<ProductSearchOverlay>(html`<relewise-product-search-overlay></relewise-product-search-overlay>`);

        await el.search('campaign');

        assert.deepEqual(el.results?.map(result => result.redirect?.destination), ['/campaign', 'https://example.com/campaign']);
    });

    test('does not search until the minimum query length is reached', async() => {
        let searchCalls = 0;
        initializeRelewiseUI(mockRelewiseOptions()).useSearch({
            debounceTimeInMs: 0,
            minimumQueryLength: 3,
        });
        const el = await fixture<ProductSearchOverlay>(html`<relewise-product-search-overlay></relewise-product-search-overlay>`);
        el.search = async() => {
            searchCalls++;
        };

        el.setSearchTerm('ab');
        await new Promise(resolve => setTimeout(resolve, 0));
        assert.equal(searchCalls, 0);

        el.setSearchTerm('abc');
        await new Promise(resolve => setTimeout(resolve, 0));
        assert.equal(searchCalls, 1);
    });

    test('cancels a pending search when the term becomes too short', async() => {
        let searchCalls = 0;
        initializeRelewiseUI(mockRelewiseOptions()).useSearch({
            debounceTimeInMs: 10,
            minimumQueryLength: 3,
        });
        const el = await fixture<ProductSearchOverlay>(html`<relewise-product-search-overlay></relewise-product-search-overlay>`);
        el.search = async() => {
            searchCalls++;
        };

        el.setSearchTerm('abc');
        el.setSearchTerm('ab');
        await new Promise(resolve => setTimeout(resolve, 20));

        assert.equal(searchCalls, 0);
    });

    test('uses a relative redirect destination when submitting the matching term', async() => {
        const originalUrl = window.location.href;
        const el = await fixture<ProductSearchOverlay>(html`<relewise-product-search-overlay></relewise-product-search-overlay>`);
        el.redirects = [{ destination: '#campaign' } as any];

        el.handleActionOnResult();

        assert.equal(window.location.hash, '#campaign');
        window.history.replaceState({}, document.title, originalUrl);
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

    test('does not reopen no-results overlay from stale hover after Escape', async() => {
        const el = await fixture<ProductSearchOverlay>(html`<relewise-product-search-overlay></relewise-product-search-overlay>`);

        el.term = 'shoe';
        el.hasCompletedSearchRequest = true;
        el.results = [{ searchTermPrediction: { term: 'shoes' } as any }];
        el.searchBarInFocus = true;
        await el.updateComplete;

        el.handleKeyDown(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
        await el.updateComplete;

        el.results = null;
        el.resultBoxIsHovered = true;
        await el.updateComplete;

        assert.notExists(el.shadowRoot!.querySelector('relewise-product-search-overlay-results'));
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
