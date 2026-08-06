import { assert, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import { ContentResult, ProductCategoryResult, ProductResult, Searcher } from '@relewise/client';
import { Button, clearUrlState, UniversalSearch, initializeRelewiseUI, QueryKeys, readCurrentUrlState, updateUrlState, updateUrlStateValues, useSearch } from '../src';
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

function productCategory(categoryId: string): ProductCategoryResult {
    return {
        $type: 'Relewise.Client.DataTypes.Search.ProductCategoryResult, Relewise.Client',
        categoryId,
        rank: 1,
        displayName: `Category ${categoryId}`,
        data: {
            Url: {
                type: 'String',
                isCollection: false,
                value: `/categories/${categoryId}`,
            },
        },
    } as ProductCategoryResult;
}

function content(contentId: string): ContentResult {
    return {
        contentId,
        rank: 1,
        displayName: `Content ${contentId}`,
        data: {
            Url: {
                type: 'String',
                isCollection: false,
                value: `/content/${contentId}`,
            },
        },
    } as ContentResult;
}

function productSearchResponse(results: ProductResult[], hits = results.length, facets: any = null) {
    return {
        $type: 'Relewise.Client.Responses.Search.ProductSearchResponse, Relewise.Client',
        hits,
        results,
        facets,
    };
}

function productCategorySearchResponse(results: ProductCategoryResult[], hits = results.length, facets: any = null) {
    return {
        $type: 'Relewise.Client.Responses.Search.ProductCategorySearchResponse, Relewise.Client',
        hits,
        results,
        facets,
    };
}

function contentSearchResponse(results: ContentResult[], hits = results.length, facets: any = null) {
    return {
        $type: 'Relewise.Client.Responses.Search.ContentSearchResponse, Relewise.Client',
        hits,
        results,
        facets,
    };
}

suite('relewise-universal-search', () => {
    const originalSearchProducts = Searcher.prototype.searchProducts;
    const originalSearchProductCategories = Searcher.prototype.searchProductCategories;
    const originalSearchContents = Searcher.prototype.searchContents;
    const originalBatch = Searcher.prototype.batch;

    setup(() => {
        clearUrlState();
        Searcher.prototype.searchProducts = originalSearchProducts;
        Searcher.prototype.searchProductCategories = originalSearchProductCategories;
        Searcher.prototype.searchContents = originalSearchContents;
        Searcher.prototype.batch = originalBatch;
        useSearch({ debounceTimeInMs: 0, universalSearch: {} });
    });

    teardown(() => {
        clearUrlState();
        fixtureCleanup();
        window.relewiseUISearchOptions = undefined!;
        window.relewiseUIOptions = undefined!;
        Searcher.prototype.searchProducts = originalSearchProducts;
        Searcher.prototype.searchProductCategories = originalSearchProductCategories;
        Searcher.prototype.searchContents = originalSearchContents;
        Searcher.prototype.batch = originalBatch;
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

    test('contains focus while open and restores focus when closed', async () => {
        const opener = await fixture<HTMLButtonElement>(html`<button type="button">Open search</button>`);
        opener.focus();

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search"></relewise-universal-search>
        `) as UniversalSearch;

        el.open();
        await el.updateComplete;

        const searchBar = el.shadowRoot!.querySelector('relewise-search-bar')!;
        const closeButton = el.shadowRoot!.querySelector('relewise-button[part="close-button"]')! as Button;
        await searchBar.updateComplete;
        await closeButton.updateComplete;

        const searchInput = searchBar.shadowRoot!.querySelector('input')!;
        const closeButtonElement = closeButton.shadowRoot!.querySelector('button')!;

        closeButtonElement.focus();
        closeButtonElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, composed: true }));
        assert.equal(searchBar.shadowRoot!.activeElement, searchInput);

        searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, composed: true }));
        assert.equal(closeButton.shadowRoot!.activeElement, closeButtonElement);

        el.close();
        await el.updateComplete;

        assert.equal(document.activeElement, opener);
    });

    test('cancels pending work when disconnected', async () => {
        let abortSignal: AbortSignal | null = null;

        Searcher.prototype.searchProducts = async function(_request, options) {
            abortSignal = options?.abortSignal ?? null;
            return await new Promise((_resolve, reject) => abortSignal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true }));
        };

        updateUrlState(QueryKeys.term, 'shoe');
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ debounceTimeInMs: 20, universalSearch: { entities: { products: {} } } });

        const searchingElement = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        await waitUntil(() => abortSignal !== null, 'search request was not started');
        searchingElement.remove();
        assert.isTrue(abortSignal!.aborted);

        clearUrlState();
        const debouncingElement = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search"></relewise-universal-search>
        `) as UniversalSearch;

        debouncingElement.setSearchTerm('boot');
        debouncingElement.remove();
        await new Promise(resolve => setTimeout(resolve, 30));

        assert.isNull(readCurrentUrlState(QueryKeys.term));
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
            universalSearch: { entities: {} },
            localization: {
                universalSearch: {
                    close: 'Luk',
                    emptyState: 'Begynd at søge.',
                    noEntitiesConfigured: 'Ingen faner konfigureret.',
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
        useSearch({ debounceTimeInMs: 0, universalSearch: { entities: { products: {} } } });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        assert.isNull(el.shadowRoot!.querySelector('[part="tabs"]'));
        assert.include(el.shadowRoot!.textContent ?? '', 'Start typing to search.');
    });

    test('searches products by default when entities are omitted', async () => {
        let productSearchCount = 0;
        let productCategorySearchCount = 0;
        let contentSearchCount = 0;
        let batchSearchCount = 0;

        Searcher.prototype.searchProducts = async function() {
            productSearchCount++;

            return productSearchResponse([product('1')]);
        };

        Searcher.prototype.searchProductCategories = async function() {
            productCategorySearchCount++;

            return productCategorySearchResponse([productCategory('1')]);
        };

        Searcher.prototype.searchContents = async function() {
            contentSearchCount++;

            return contentSearchResponse([content('1')]);
        };

        Searcher.prototype.batch = async function() {
            batchSearchCount++;

            return {
                responses: [
                    productSearchResponse([product('1')]),
                    productCategorySearchResponse([productCategory('1')]),
                    contentSearchResponse([content('1')]),
                ],
            } as any;
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ debounceTimeInMs: 0, universalSearch: {} });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        el.setSearchTerm('shoe');
        await waitUntil(() => el.products.length === 1, 'default product results were not loaded');

        assert.equal(productSearchCount, 1);
        assert.equal(productCategorySearchCount, 0);
        assert.equal(contentSearchCount, 0);
        assert.equal(batchSearchCount, 0);
        assert.equal(el.shadowRoot!.querySelectorAll('[part="tab"]').length, 1);
        assert.include(el.shadowRoot!.querySelector('[part="tab"]')?.textContent ?? '', 'Products');
        assert.equal(
            getComputedStyle(el.shadowRoot!.querySelector<HTMLElement>('[part="header"]')!).borderBottomColor,
            'rgb(238, 238, 238)',
        );
        assert.equal(
            getComputedStyle(el.shadowRoot!.querySelector<HTMLElement>('[part="tabs"]')!).borderBottomColor,
            'rgb(238, 238, 238)',
        );
    });

    test('searches and renders products when products tab is configured', async () => {
        let capturedTerm: string | null = null;

        Searcher.prototype.searchProducts = async function(request) {
            capturedTerm = request.term ?? null;

            return productSearchResponse([product('1')]);
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ debounceTimeInMs: 0, universalSearch: { entities: { products: { pageSize: 2 } } } });

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
            return productSearchResponse([], 0);
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ debounceTimeInMs: 50, universalSearch: { entities: { products: {} } } });

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
            const term = request.term ?? 'missing';

            return productSearchResponse([product(term)]);
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ debounceTimeInMs: 50, universalSearch: { entities: { products: {} } } });

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
            return productSearchResponse([], 0);
        };

        updateUrlStateValues(QueryKeys.facet + 'Brand', ['Adidas', 'Nike']);
        updateUrlStateValues(QueryKeys.productFacet + 'Brand', ['Adidas', 'Nike']);
        updateUrlStateValues(QueryKeys.productCategoryFacet + 'DataDepartment', ['Electronics']);
        updateUrlStateValues(QueryKeys.contentFacet + 'DataTopic', ['Guide']);
        updateUrlState(QueryKeys.productTake, '4');
        updateUrlState(QueryKeys.productCategoryTake, '4');
        updateUrlState(QueryKeys.contentTake, '4');
        updateUrlState(QueryKeys.sortBy, 'price');
        updateUrlState(QueryKeys.productSorting, 'SalesPriceAsc');

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ debounceTimeInMs: 0, universalSearch: { entities: { products: {} } } });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        el.setSearchTerm('boot');

        await waitUntil(() => readCurrentUrlState(QueryKeys.term) === 'boot', 'term was not written to URL state');

        assert.deepEqual(new URL(window.location.href).searchParams.getAll(QueryKeys.facet + 'Brand'), []);
        assert.deepEqual(new URL(window.location.href).searchParams.getAll(QueryKeys.productFacet + 'Brand'), []);
        assert.deepEqual(new URL(window.location.href).searchParams.getAll(QueryKeys.productCategoryFacet + 'DataDepartment'), []);
        assert.deepEqual(new URL(window.location.href).searchParams.getAll(QueryKeys.contentFacet + 'DataTopic'), []);
        assert.isNull(readCurrentUrlState(QueryKeys.productTake));
        assert.isNull(readCurrentUrlState(QueryKeys.productCategoryTake));
        assert.isNull(readCurrentUrlState(QueryKeys.contentTake));
        assert.equal(readCurrentUrlState(QueryKeys.sortBy), 'price');
        assert.isNull(readCurrentUrlState(QueryKeys.productSorting));
    });

    test('uses products tab localization', async () => {
        Searcher.prototype.searchProducts = async function() {
            return productSearchResponse([], 0);
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: { entities: { products: { pageSize: 2 } } },
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

    test('uses default labels for properties omitted from tab localization', async () => {
        Searcher.prototype.searchProducts = async function() {
            return productSearchResponse([], 0);
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: { entities: { products: { pageSize: 2 } } },
            localization: {
                universalSearch: {
                    products: {
                        tab: 'Items',
                    },
                },
            },
        });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        el.setSearchTerm('shoe');
        await waitUntil(() => el.shadowRoot!.querySelector('[part="zero-results"]') !== null, 'zero-results was not rendered');

        assert.include(el.shadowRoot!.querySelector('[part="tab"]')?.textContent ?? '', 'Items');
        assert.include(el.shadowRoot!.querySelector('[part="results-summary"]')?.textContent ?? '', 'Search results for');
        assert.equal(el.shadowRoot!.querySelector('[part="results-title"]')?.textContent?.trim(), 'Products');
        assert.equal(el.shadowRoot!.querySelector('[part="results-count"]')?.textContent?.trim(), '0 Results');
        assert.equal(el.shadowRoot!.querySelector('[part="zero-results"]')?.textContent?.trim(), 'No products found.');
    });

    test('keeps facets available when a selected filter returns zero results', async () => {
        const facets = { items: [] };

        Searcher.prototype.batch = async function() {
            return {
                responses: [
                    productSearchResponse([], 0, facets),
                    productCategorySearchResponse([], 0, facets),
                    contentSearchResponse([], 0, facets),
                ],
            } as any;
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: {
                    products: {},
                    productCategories: {},
                    content: {},
                },
            },
        });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        el.setSearchTerm('shoe');
        await waitUntil(
            () => el.productSearchResult !== null && el.productCategorySearchResult !== null && el.contentSearchResult !== null,
            'zero-result searches did not complete',
        );

        assert.isNotNull(el.shadowRoot!.querySelector('relewise-facets'));

        el.handleSelectTab('productCategories');
        await el.updateComplete;
        assert.isNotNull(el.shadowRoot!.querySelector('relewise-facets'));

        el.handleSelectTab('content');
        await el.updateComplete;
        assert.isNotNull(el.shadowRoot!.querySelector('relewise-facets'));
    });

    test('loads more products using scoped take URL state', async () => {
        let searchCount = 0;

        Searcher.prototype.searchProducts = async function() {
            searchCount++;

            return productSearchResponse(searchCount === 1 ? [product('1'), product('2')] : [product('3')], 3);
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ debounceTimeInMs: 0, universalSearch: { entities: { products: { pageSize: 2 } } } });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        el.setSearchTerm('shoe');
        await waitUntil(() => el.products.length === 2, 'initial products were not rendered');

        el.handleLoadMoreActiveTab();
        await waitUntil(() => el.products.length === 3, 'more products were not appended');

        assert.equal(readCurrentUrlState(QueryKeys.productTake), '4');
        assert.isNull(readCurrentUrlState(QueryKeys.take));
        assert.equal(el.shadowRoot!.querySelectorAll('relewise-product-tile').length, 3);
    });

    test('prevents overlapping load-more requests', async () => {
        let searchCount = 0;
        let resolveLoadMore!: (response: ReturnType<typeof productSearchResponse>) => void;

        Searcher.prototype.searchProducts = async function() {
            searchCount++;

            if (searchCount === 1) {
                return productSearchResponse([product('1'), product('2')], 6);
            }

            return await new Promise(resolve => resolveLoadMore = resolve);
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ debounceTimeInMs: 0, universalSearch: { entities: { products: { pageSize: 2 } } } });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        el.setSearchTerm('shoe');
        await waitUntil(() => el.products.length === 2, 'initial products were not rendered');

        el.handleLoadMoreActiveTab();
        el.handleLoadMoreActiveTab();
        await waitUntil(() => searchCount === 2, 'load-more request was not started');
        await el.updateComplete;

        assert.equal(searchCount, 2);
        assert.equal(el.productPage, 2);
        assert.isNull(readCurrentUrlState(QueryKeys.productTake));
        assert.isNull(el.shadowRoot!.querySelector('[part="load-more"]'));

        resolveLoadMore(productSearchResponse([product('3'), product('4')], 6));
        await waitUntil(() => el.products.length === 4, 'load-more products were not rendered');
        assert.equal(readCurrentUrlState(QueryKeys.productTake), '4');
    });

    test('rolls back pagination when load more fails', async () => {
        let searchCount = 0;
        const requestedPages: number[] = [];

        Searcher.prototype.searchProducts = async function(request) {
            searchCount++;
            requestedPages.push(((request as any).skip / (request as any).take) + 1);

            if (searchCount === 1) {
                return productSearchResponse([product('1'), product('2')], 4);
            }
            if (searchCount === 2) {
                throw new Error('Temporary failure');
            }
            return productSearchResponse([product('3'), product('4')], 4);
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ debounceTimeInMs: 0, universalSearch: { entities: { products: { pageSize: 2 } } } });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        el.setSearchTerm('shoe');
        await waitUntil(() => el.products.length === 2, 'initial products were not rendered');

        await el.handleLoadMoreActiveTab();

        assert.equal(el.productPage, 1);
        assert.isNull(readCurrentUrlState(QueryKeys.productTake));

        await el.handleLoadMoreActiveTab();

        assert.deepEqual(requestedPages, [1, 2, 2]);
        assert.equal(el.productPage, 2);
        assert.equal(readCurrentUrlState(QueryKeys.productTake), '4');
        assert.deepEqual(el.products.map(result => result.productId), ['1', '2', '3', '4']);
    });

    test('continues product load more from an existing scoped take URL state', async () => {
        let searchCount = 0;

        Searcher.prototype.searchProducts = async function() {
            searchCount++;

            return productSearchResponse(searchCount === 1
                ? [product('1'), product('2'), product('3'), product('4')]
                : [product('5'), product('6')], 6);
        };

        updateUrlState(QueryKeys.term, 'shoe');
        updateUrlState(QueryKeys.productTake, '4');

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ debounceTimeInMs: 0, universalSearch: { entities: { products: { pageSize: 2 } } } });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        await waitUntil(() => el.products.length === 4, 'initial URL take was not loaded');

        el.handleLoadMoreActiveTab();
        await waitUntil(() => el.products.length === 6, 'more products were not appended after URL take');

        assert.equal(readCurrentUrlState(QueryKeys.productTake), '6');
    });

    test('loads more content using scoped take URL state', async () => {
        let searchCount = 0;

        Searcher.prototype.searchContents = async function() {
            searchCount++;

            return contentSearchResponse(searchCount === 1 ? [content('1'), content('2')] : [content('3')], 3);
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ debounceTimeInMs: 0, universalSearch: { entities: { content: { pageSize: 2 } } } });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        el.setSearchTerm('guide');
        await waitUntil(() => el.content.length === 2, 'initial content was not rendered');

        el.handleLoadMoreActiveTab();
        await waitUntil(() => el.content.length === 3, 'more content was not appended');

        assert.equal(readCurrentUrlState(QueryKeys.contentTake), '4');
    });

    test('continues content load more from an existing scoped take URL state', async () => {
        let searchCount = 0;

        Searcher.prototype.searchContents = async function() {
            searchCount++;

            return contentSearchResponse(searchCount === 1
                ? [content('1'), content('2'), content('3'), content('4')]
                : [content('5'), content('6')], 6);
        };

        updateUrlState(QueryKeys.term, 'guide');
        updateUrlState(QueryKeys.contentTake, '4');

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ debounceTimeInMs: 0, universalSearch: { entities: { content: { pageSize: 2 } } } });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        await waitUntil(() => el.content.length === 4, 'initial content URL take was not loaded');

        el.handleLoadMoreActiveTab();
        await waitUntil(() => el.content.length === 6, 'more content was not appended after URL take');

        assert.equal(readCurrentUrlState(QueryKeys.contentTake), '6');
    });

    test('loads more product categories using scoped take URL state', async () => {
        let searchCount = 0;

        Searcher.prototype.searchProductCategories = async function() {
            searchCount++;

            return productCategorySearchResponse(searchCount === 1 ? [productCategory('1'), productCategory('2')] : [productCategory('3')], 3);
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ debounceTimeInMs: 0, universalSearch: { entities: { productCategories: { pageSize: 2 } } } });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        el.setSearchTerm('shoe');
        await waitUntil(() => el.productCategories.length === 2, 'initial product categories were not rendered');

        el.handleLoadMoreActiveTab();
        await waitUntil(() => el.productCategories.length === 3, 'more product categories were not appended');

        assert.equal(readCurrentUrlState(QueryKeys.productCategoryTake), '4');
    });

    test('batches enabled product category and content tabs', async () => {
        let requestCount = 0;

        Searcher.prototype.batch = async function(requestCollection) {
            requestCount = requestCollection.requests.length;

            return {
                responses: [
                    productCategorySearchResponse([productCategory('1')]),
                    contentSearchResponse([content('1')]),
                ],
            } as any;
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: {
                    productCategories: { pageSize: 2 },
                    content: { pageSize: 2 },
                },
            },
        });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        el.setSearchTerm('shoe');
        await waitUntil(() => el.productCategories.length === 1 && el.content.length === 1, 'category and content results were not loaded');

        assert.equal(requestCount, 2);
        const tabs = [...el.shadowRoot!.querySelectorAll<HTMLElement>('[part="tab"]')];
        assert.equal(tabs.length, 2);
        assert.equal(el.shadowRoot!.querySelector('[part="tabs"]')?.getAttribute('role'), 'tablist');
        assert.equal(tabs[0].getAttribute('role'), 'tab');
        assert.equal(tabs[0].tabIndex, 0);
        assert.equal(tabs[1].tabIndex, -1);
        assert.equal(el.shadowRoot!.querySelectorAll('relewise-category-tile').length, 1);

        tabs[0].focus();
        tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        await el.updateComplete;

        const selectedTab = el.shadowRoot!.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')!;
        const panel = el.shadowRoot!.querySelector<HTMLElement>('[role="tabpanel"]')!;
        assert.equal(el.activeTab, 'content');
        assert.equal(el.shadowRoot!.activeElement, selectedTab);
        assert.equal(selectedTab.tabIndex, 0);
        assert.equal(panel.getAttribute('aria-labelledby'), selectedTab.id);
        assert.equal(selectedTab.getAttribute('aria-controls'), panel.id);
        assert.equal(el.shadowRoot!.querySelectorAll('relewise-content-tile').length, 1);
    });

    test('includes configured product category facets in product category requests', async () => {
        let facetItems: any[] | undefined;

        Searcher.prototype.searchProductCategories = async function(request) {
            facetItems = (request as any).facets?.items;

            return productCategorySearchResponse([productCategory('1')]);
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            facets: {
                productCategory(builder) {
                    builder.addFacet(f => f.addProductCategoryDataStringValueFacet('Department'), { heading: 'Department' });
                },
            },
            universalSearch: {
                entities: {
                    productCategories: { pageSize: 2 },
                },
            },
        });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        el.setSearchTerm('shoe');
        await waitUntil(() => el.productCategories.length === 1, 'category result was not loaded');

        assert.equal(facetItems?.[0].key, 'Department');
        assert.deepEqual(el.productCategoryFacetLabels, ['Department']);
    });

    test('does not request disabled tabs', async () => {
        let batchRequestCount = 0;
        let contentRequestCount = 0;

        Searcher.prototype.batch = async function(requestCollection) {
            batchRequestCount = requestCollection.requests.length;

            return {
                responses: [],
            } as any;
        };

        Searcher.prototype.searchContents = async function() {
            contentRequestCount++;

            return contentSearchResponse([content('1')]);
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: {
                    content: { pageSize: 2 },
                },
            },
        });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        el.setSearchTerm('shoe');
        await waitUntil(() => el.content.length === 1, 'content result was not loaded');

        assert.equal(batchRequestCount, 0);
        assert.equal(contentRequestCount, 1);
        assert.equal(el.products.length, 0);
        assert.equal(el.productCategories.length, 0);
        assert.equal(el.shadowRoot!.querySelectorAll('[part="tab"]').length, 1);
    });

    test('searches only the active tab when search configuration changes', async () => {
        const requestCounts: number[] = [];
        let contentSearchCount = 0;

        Searcher.prototype.batch = async function(requestCollection) {
            requestCounts.push(requestCollection.requests.length);

            return {
                responses: [
                    productSearchResponse([product('1')]),
                    contentSearchResponse([content('1')], 1, { items: [] }),
                ],
            } as any;
        };

        Searcher.prototype.searchContents = async function() {
            contentSearchCount++;

            return contentSearchResponse([content('2')]);
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: {
                    products: { pageSize: 2 },
                    content: { pageSize: 2 },
                },
            },
        });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        el.setSearchTerm('shoe');
        await waitUntil(() => el.products.length === 1 && el.content.length === 1, 'initial batched search did not complete');

        el.handleSelectTab('content');
        await el.updateComplete;
        el.shadowRoot!.querySelector<any>('relewise-facets')!.applyFacet();

        await waitUntil(() => el.content.length === 1 && el.content[0].contentId === '2', 'active tab search did not replace content results');

        assert.deepEqual(requestCounts, [2]);
        assert.equal(contentSearchCount, 1);
        assert.equal(el.products.length, 1);
        assert.equal(el.products[0].productId, '1');
    });

    test('uses localized errors without hiding successful tabs', async () => {
        Searcher.prototype.batch = async function() {
            return {
                responses: [
                    productSearchResponse([product('1')]),
                    contentSearchResponse([content('1')]),
                ],
            } as any;
        };

        Searcher.prototype.searchContents = async function() {
            throw new Error('Raw SDK error');
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            localization: {
                universalSearch: {
                    content: {
                        error: 'Could not refresh content.',
                    },
                },
            },
            universalSearch: {
                entities: {
                    products: {},
                    content: {},
                },
            },
        });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        el.setSearchTerm('shoe');
        await waitUntil(() => el.products.length === 1 && el.content.length === 1, 'initial results did not load');

        el.handleSelectTab('content');
        el.onSearchOptionsChanged();
        await waitUntil(() => el.shadowRoot!.querySelector('[part="error-state"]') !== null, 'localized error was not rendered');

        assert.equal(el.shadowRoot!.querySelector('[part="error-state"]')?.textContent, 'Could not refresh content.');

        el.handleSelectTab('products');
        await el.updateComplete;

        assert.isNull(el.shadowRoot!.querySelector('[part="error-state"]'));
        assert.equal(el.shadowRoot!.querySelectorAll('relewise-product-tile').length, 1);
    });
});

