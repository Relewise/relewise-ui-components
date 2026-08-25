import { assert, fixture, html } from '@open-wc/testing';
import { Searcher } from '@relewise/client';
import { initializeRelewiseUI, ProductSearch } from '../src';
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
});
