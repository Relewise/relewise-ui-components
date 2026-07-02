import { assert, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import { ProductResult, Searcher } from '@relewise/client';
import { clearUrlState, UniversalSearch, initializeRelewiseUI, QueryKeys, readCurrentUrlState, updateUrlState, updateUrlStateValues, useSearch } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

function product(productId: string): ProductResult {
    return {
        productId,
        rank: 1,
        displayName: `Product ${productId}`,
        salesPrice: 10,
        data: {
            Url: {
                type: 'String',
                isCollection: false,
                value: `/products/${productId}`,
            },
        },
    } as ProductResult;
}

suite('relewise-universal-search', () => {
    const originalSearchProducts = Searcher.prototype.searchProducts;

    setup(() => {
        clearUrlState();
        Searcher.prototype.searchProducts = originalSearchProducts;
        useSearch({ debounceTimeInMs: 0, universalSearch: {} });
    });

    teardown(() => {
        clearUrlState();
        fixtureCleanup();
        window.relewiseUISearchOptions = undefined!;
        window.relewiseUIOptions = undefined!;
        Searcher.prototype.searchProducts = originalSearchProducts;
    });

    test('is registered through useSearch', () => {
        assert.isDefined(customElements.get('relewise-universal-search'));
    });

    test('prefills term from URL without opening', async () => {
        updateUrlState(QueryKeys.term, 'shoe');

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search"></relewise-universal-search>
        `) as UniversalSearch;

        assert.equal(el.term, 'shoe');
        assert.isFalse(el.isOpen);
        assert.isFalse(el.hasAttribute('open'));
    });

    test('opens and closes through methods', async () => {
        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search"></relewise-universal-search>
        `) as UniversalSearch;

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
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        assert.isTrue(el.isOpen);
        assert.isNotNull(el.shadowRoot!.querySelector('[role="dialog"]'));
    });

    test('uses universal-search localization', async () => {
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {},
            localization: {
                universalSearch: {
                    close: 'Luk',
                    emptyState: 'Begynd at søge.',
                    noTabsConfigured: 'Ingen faner konfigureret.',
                },
            },
        });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        const closeButton = el.shadowRoot!.querySelector('relewise-button[part="close-button"]');
        const emptyState = el.shadowRoot!.querySelector('[part="empty-state"]');

        assert.equal(closeButton?.getAttribute('button-text'), 'Luk');
        assert.equal(emptyState?.textContent?.trim(), 'Begynd at søge.');

        el.setSearchTerm('sko');
        await waitUntil(() => el.shadowRoot!.textContent?.includes('Ingen faner konfigureret.'), 'no tabs text was not localized');
    });

    test('closes on Escape', async () => {
        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        await el.updateComplete;

        assert.isFalse(el.isOpen);
    });

    test('writes term to URL state', async () => {
        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        el.setSearchTerm('shoe');

        await waitUntil(() => readCurrentUrlState(QueryKeys.term) === 'shoe', 'term was not written to URL state');
    });

    test('does not render tabs without a search term', async () => {
        useSearch({ debounceTimeInMs: 0, universalSearch: { tabs: { products: {} } } });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        assert.isNull(el.shadowRoot!.querySelector('[part="tabs"]'));
        assert.include(el.shadowRoot!.textContent ?? '', 'Start typing to search.');
    });

    test('searches and renders products when products tab is configured', async () => {
        let capturedTerm: string | null = null;

        Searcher.prototype.searchProducts = async function(request) {
            capturedTerm = request.term ?? null;

            return {
                hits: 1,
                results: [product('1')],
                facets: null,
            } as any;
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ debounceTimeInMs: 0, universalSearch: { tabs: { products: { pageSize: 2 } } } });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        el.setSearchTerm('shoe');

        await waitUntil(() => el.products.length === 1, 'products were not rendered');

        assert.equal(capturedTerm, 'shoe');
        assert.isNotNull(el.shadowRoot!.querySelector('[part="tabs"]'));
        assert.equal(el.shadowRoot!.querySelectorAll('relewise-product-tile').length, 1);
    });

    test('does not render zero results before product search responds', async () => {
        Searcher.prototype.searchProducts = async function() {
            return {
                hits: 0,
                results: [],
                facets: null,
            } as any;
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ debounceTimeInMs: 50, universalSearch: { tabs: { products: {} } } });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        el.setSearchTerm('shoe');
        await el.updateComplete;

        assert.isNull(el.shadowRoot!.querySelector('[part="zero-results"]'));
        assert.isNotNull(el.shadowRoot!.querySelector('relewise-loading-spinner'));

        await waitUntil(() => el.shadowRoot!.querySelector('[part="zero-results"]') !== null, 'zero-results was not rendered after search response');
    });

    test('clears previous products when the search term changes', async () => {
        Searcher.prototype.searchProducts = async function(request) {
            return {
                hits: 1,
                results: [product(request.term ?? 'missing')],
                facets: null,
            } as any;
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ debounceTimeInMs: 50, universalSearch: { tabs: { products: {} } } });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        el.setSearchTerm('shoe');
        await waitUntil(() => el.products.length === 1, 'initial products were not rendered');

        el.setSearchTerm('boot');
        await el.updateComplete;

        assert.equal(el.products.length, 0);
        assert.equal(el.shadowRoot!.querySelectorAll('relewise-product-tile').length, 0);

        await waitUntil(() => el.products.length === 1, 'new products were not rendered');
        assert.equal(el.products[0].productId, 'boot');
    });

    test('clears facet URL state when the search term changes', async () => {
        Searcher.prototype.searchProducts = async function() {
            return {
                hits: 0,
                results: [],
                facets: null,
            } as any;
        };

        updateUrlStateValues(QueryKeys.facet + 'Brand', ['Adidas', 'Nike']);
        updateUrlState(QueryKeys.facetLowerbound + 'SalesPrice', '50');
        updateUrlState(QueryKeys.facetUpperbound + 'SalesPrice', '100');
        updateUrlState(QueryKeys.sortBy, 'price');

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ debounceTimeInMs: 0, universalSearch: { tabs: { products: {} } } });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        el.setSearchTerm('boot');

        await waitUntil(() => readCurrentUrlState(QueryKeys.term) === 'boot', 'term was not written to URL state');

        assert.deepEqual(new URL(window.location.href).searchParams.getAll(QueryKeys.facet + 'Brand'), []);
        assert.isNull(readCurrentUrlState(QueryKeys.facetLowerbound + 'SalesPrice'));
        assert.isNull(readCurrentUrlState(QueryKeys.facetUpperbound + 'SalesPrice'));
        assert.equal(readCurrentUrlState(QueryKeys.sortBy), 'price');
    });

    test('uses products tab localization', async () => {
        Searcher.prototype.searchProducts = async function() {
            return {
                hits: 0,
                results: [],
                facets: null,
            } as any;
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: { tabs: { products: { pageSize: 2 } } },
            localization: {
                universalSearch: {
                    tabsLabel: 'Søgeresultatfaner',
                    products: {
                        tab: 'Varer',
                        resultsFor: 'Søgeresultater for',
                        resultsTitle: 'Vareresultater',
                        result: 'vare',
                        results: 'varer',
                        noResults: 'Ingen varer fundet.',
                    },
                },
            },
        });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        el.setSearchTerm('sko');
        await waitUntil(() => el.shadowRoot!.querySelector('[part="zero-results"]') !== null, 'zero-results was not rendered');

        assert.equal(el.shadowRoot!.querySelector('[part="tabs"]')?.getAttribute('aria-label'), 'Søgeresultatfaner');
        assert.include(el.shadowRoot!.querySelector('[part="tab"]')?.textContent ?? '', 'Varer');
        assert.include(el.shadowRoot!.querySelector('[part="results-summary"]')?.textContent ?? '', 'Søgeresultater for');
        assert.equal(el.shadowRoot!.querySelector('[part="results-title"]')?.textContent?.trim(), 'Vareresultater');
        assert.equal(el.shadowRoot!.querySelector('[part="results-count"]')?.textContent?.trim(), '0 varer');
        assert.equal(el.shadowRoot!.querySelector('[part="zero-results"]')?.textContent?.trim(), 'Ingen varer fundet.');
    });

    test('loads more products using existing take URL state', async () => {
        let searchCount = 0;

        Searcher.prototype.searchProducts = async function() {
            searchCount++;

            return {
                hits: 3,
                results: searchCount === 1 ? [product('1'), product('2')] : [product('3')],
                facets: null,
            } as any;
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ debounceTimeInMs: 0, universalSearch: { tabs: { products: { pageSize: 2 } } } });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        el.setSearchTerm('shoe');
        await waitUntil(() => el.products.length === 2, 'initial products were not rendered');

        el.handleLoadMoreProducts();
        await waitUntil(() => el.products.length === 3, 'more products were not appended');

        assert.equal(readCurrentUrlState(QueryKeys.take), '4');
        assert.equal(el.shadowRoot!.querySelectorAll('relewise-product-tile').length, 3);
    });

    test('continues load more from an existing take URL state', async () => {
        let searchCount = 0;

        Searcher.prototype.searchProducts = async function() {
            searchCount++;

            return {
                hits: 6,
                results: searchCount === 1
                    ? [product('1'), product('2'), product('3'), product('4')]
                    : [product('5'), product('6')],
                facets: null,
            } as any;
        };

        updateUrlState(QueryKeys.term, 'shoe');
        updateUrlState(QueryKeys.take, '4');

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ debounceTimeInMs: 0, universalSearch: { tabs: { products: { pageSize: 2 } } } });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        await waitUntil(() => el.products.length === 4, 'initial URL take was not loaded');

        el.handleLoadMoreProducts();
        await waitUntil(() => el.products.length === 6, 'more products were not appended after URL take');

        assert.equal(readCurrentUrlState(QueryKeys.take), '6');
    });
});
