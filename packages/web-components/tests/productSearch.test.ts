import { assert, fixture, html, waitUntil } from '@open-wc/testing';
import { Searcher } from '@relewise/client';
import { initializeRelewiseUI, ProductSearch } from '../src';
import { QueryKeys, readCurrentUrlState } from '../src/helpers';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('product search', () => {
    const originalSearchProducts = Searcher.prototype.searchProducts;
    const originalUrl = window.location.href;

    teardown(() => {
        Searcher.prototype.searchProducts = originalSearchProducts;
        window.history.replaceState({}, document.title, originalUrl);
    });

    test('does not request products for a non-empty term below the minimum query length', async() => {
        let searchCalls = 0;
        Searcher.prototype.searchProducts = async function() {
            searchCalls++;
            return { hits: 0, results: [] } as any;
        };
        initializeRelewiseUI(mockRelewiseOptions()).useSearch({
            minimumQueryLength: 3,
        });
        window.history.replaceState({}, document.title, '?rw-term=ab');
        const el = new ProductSearch();

        await el.search(false);

        assert.equal(searchCalls, 0);
        assert.deepEqual(el.products, []);
        assert.isNull(el.searchResult);
    });

    test('continues to request products for an empty term', async() => {
        let searchCalls = 0;
        Searcher.prototype.searchProducts = async function() {
            searchCalls++;
            return { hits: 0, results: [] } as any;
        };
        initializeRelewiseUI(mockRelewiseOptions()).useSearch({
            minimumQueryLength: 3,
        });
        window.history.replaceState({}, document.title, window.location.pathname);
        const el = await fixture<ProductSearch>(html`<relewise-product-search></relewise-product-search>`);
        await el.search(false);

        assert.isAtLeast(searchCalls, 1);
    });

    test('settles with the empty state when context resolution fails', async() => {
        const options = mockRelewiseOptions();
        options.contextSettings.getUser = async() => {
            throw new Error('Unable to resolve the user');
        };
        initializeRelewiseUI(options).useSearch();
        window.history.replaceState({}, document.title, window.location.pathname);

        const el = await fixture<ProductSearch>(html`<relewise-product-search></relewise-product-search>`);
        const results = el.renderRoot.querySelector('relewise-product-search-results') as HTMLElement & {
            showLoadingSpinner: boolean;
            updateComplete: Promise<boolean>;
        };
        await waitUntil(() => !results.showLoadingSpinner);
        await results.updateComplete;

        assert.deepEqual(el.products, []);
        assert.isNull(el.searchResult);
        assert.include(results.shadowRoot!.textContent, 'No results');
    });

    test('settles with the empty state when the SDK returns no response', async() => {
        Searcher.prototype.searchProducts = async function() {
            return undefined as any;
        };
        initializeRelewiseUI(mockRelewiseOptions()).useSearch();
        window.history.replaceState({}, document.title, window.location.pathname);

        const el = await fixture<ProductSearch>(html`<relewise-product-search></relewise-product-search>`);
        const results = el.renderRoot.querySelector('relewise-product-search-results') as HTMLElement & {
            showLoadingSpinner: boolean;
            updateComplete: Promise<boolean>;
        };
        await waitUntil(() => !results.showLoadingSpinner);
        await results.updateComplete;

        assert.deepEqual(el.products, []);
        assert.isNull(el.searchResult);
        assert.include(results.shadowRoot!.textContent, 'No results');
    });

    for (const failure of ['throws', 'returns no response'] as const) {
        test(`settles and preserves existing results when a refresh request ${failure}`, async() => {
            let searchCalls = 0;
            Searcher.prototype.searchProducts = async function() {
                searchCalls++;
                if (searchCalls === 1) {
                    return { hits: 1, results: [{ productId: 'existing' }] } as any;
                }

                if (failure === 'throws') {
                    throw new Error('Search failed');
                }

                return undefined as any;
            };
            initializeRelewiseUI(mockRelewiseOptions()).useSearch();
            window.history.replaceState({}, document.title, window.location.pathname);
            const el = await fixture<ProductSearch>(html`<relewise-product-search></relewise-product-search>`);
            await waitUntil(() => el.products.length === 1);
            const previousResult = el.searchResult;
            el.facetLabels = ['Existing'];
            const results = el.renderRoot.querySelector('relewise-product-search-results') as HTMLElement & {
                showDimmingOverlay: boolean;
                showLoadingSpinner: boolean;
            };

            await el.search(true);

            assert.strictEqual(el.searchResult, previousResult);
            assert.deepEqual(el.products.map(product => product.productId), ['existing']);
            assert.deepEqual(el.facetLabels, ['Existing']);
            assert.isFalse(results.showDimmingOverlay);
            assert.isFalse(results.showLoadingSpinner);
        });
    }

    for (const failure of ['throws', 'returns no response'] as const) {
        test(`retries the same pagination when load more ${failure}`, async() => {
            let searchCalls = 0;
            const requestedPages: number[] = [];
            const requestError = new Error('Temporary failure');
            Searcher.prototype.searchProducts = async function(request) {
                searchCalls++;
                requestedPages.push(((request as any).skip / (request as any).take) + 1);

                if (searchCalls === 1) {
                    return { hits: 4, results: [{ productId: '1' }, { productId: '2' }] } as any;
                }
                if (searchCalls === 2) {
                    if (failure === 'throws') {
                        throw requestError;
                    }

                    return undefined as any;
                }

                return { hits: 4, results: [{ productId: '3' }, { productId: '4' }] } as any;
            };
            initializeRelewiseUI(mockRelewiseOptions()).useSearch();
            window.history.replaceState({}, document.title, '?rw-term=shoe');
            const el = await fixture<ProductSearch>(html`
                <relewise-product-search
                    displayed-at-location="test"
                    number-of-products="2">
                </relewise-product-search>
            `);
            await waitUntil(() => el.products.length === 2);
            const originalConsoleError = console.error;
            const reportedErrors: unknown[][] = [];
            console.error = (...args: unknown[]) => reportedErrors.push(args);

            try {
                await el.handleLoadMoreEvent();

                assert.equal(el.page, 1);
                assert.isNull(readCurrentUrlState(QueryKeys.take));

                await el.handleLoadMoreEvent();
            } finally {
                console.error = originalConsoleError;
            }

            assert.deepEqual(requestedPages, [1, 2, 2]);
            assert.equal(readCurrentUrlState(QueryKeys.take), '4');
            assert.deepEqual(el.products.map(product => product.productId), ['1', '2', '3', '4']);
            assert.lengthOf(reportedErrors, failure === 'throws' ? 1 : 0);
            if (failure === 'throws') {
                assert.equal(reportedErrors[0][0], 'Relewise Web Components: Product search failed.');
                assert.strictEqual(reportedErrors[0][1], requestError);
            }
        });
    }

    test('passes total hits to slotted facets', async() => {
        Searcher.prototype.searchProducts = async function() {
            return {
                hits: 26,
                results: [],
                facets: { items: [] },
            } as any;
        };
        initializeRelewiseUI(mockRelewiseOptions()).useSearch();
        window.history.replaceState({}, document.title, window.location.pathname);
        const el = await fixture<ProductSearch>(html`
            <relewise-product-search displayed-at-location="test">
                <relewise-facets></relewise-facets>
            </relewise-product-search>
        `);
        const facets = el.querySelector('relewise-facets')!;

        await waitUntil(() => facets.getAttribute('total-hits') === '26');

        assert.equal(facets.getAttribute('total-hits'), '26');
    });

    test('does not issue a request after disconnecting during context resolution', async() => {
        let searchCalls = 0;
        Searcher.prototype.searchProducts = async function() {
            searchCalls++;
            return { hits: 0, results: [] } as any;
        };
        const options = mockRelewiseOptions();
        const getUser = options.contextSettings.getUser;
        let contextCalls = 0;
        let releaseContext!: () => void;
        const contextGate = new Promise<void>(resolve => releaseContext = resolve);
        options.contextSettings.getUser = async() => {
            contextCalls++;
            await contextGate;
            return getUser();
        };
        initializeRelewiseUI(options).useSearch();
        window.history.replaceState({}, document.title, window.location.pathname);
        const el = await fixture<ProductSearch>(html`<relewise-product-search></relewise-product-search>`);
        await waitUntil(() => contextCalls === 1);

        el.remove();
        releaseContext();
        await new Promise(resolve => setTimeout(resolve, 0));

        assert.equal(searchCalls, 0);
        assert.deepEqual(el.products, []);
        assert.isNull(el.searchResult);
    });

    test('ignores a response received after disconnecting an in-flight request', async() => {
        let capturedSignal: AbortSignal | undefined;
        let releaseResponse!: () => void;
        const responseGate = new Promise<void>(resolve => releaseResponse = resolve);
        Searcher.prototype.searchProducts = async function(_request, requestOptions) {
            capturedSignal = requestOptions!.abortSignal;
            await responseGate;
            return { hits: 1, results: [{ productId: 'stale' }] } as any;
        };
        initializeRelewiseUI(mockRelewiseOptions()).useSearch();
        window.history.replaceState({}, document.title, window.location.pathname);
        const el = await fixture<ProductSearch>(html`<relewise-product-search></relewise-product-search>`);
        await waitUntil(() => capturedSignal !== undefined);

        el.remove();
        assert.isTrue(capturedSignal!.aborted);
        releaseResponse();
        await new Promise(resolve => setTimeout(resolve, 0));

        assert.deepEqual(el.products, []);
        assert.isNull(el.searchResult);
    });
});
