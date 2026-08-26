import { assert, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import { ContentResult, ProductCategoryResult, ProductResult, Searcher } from '@relewise/client';
import { Button, clearUrlState, UniversalSearch, UniversalSearchTab, initializeRelewiseUI, QueryKeys, readCurrentUrlState, universalSearchTabs, updateUrlState, updateUrlStateValues, useSearch } from '../src';
import { updateUrlStateForUniversalSearchTerm } from '../src/search/universal-search/universal-search-url-state';
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

function multiOptionFacetResult() {
    return {
        items: [{
            $type: 'Relewise.Client.DataTypes.Search.Facets.Result.ProductDataStringValueFacetResult, Relewise.Client',
            field: 'Data',
            key: 'Color',
            available: ['Blue', 'Red'].map(value => ({
                value,
                hits: 1,
                selected: false,
            })),
        }],
    };
}

type UniversalSearchTestApi = {
    term: string;
    activeTab: UniversalSearchTab | null;
    setSearchTerm: (term: string) => void;
    handleSelectTab: (tab: UniversalSearchTab) => void;
};

type TabTestApi<TResult> = {
    result: unknown;
    resultOffset: number;
    facetLabels: string[];
    loadMore: () => Promise<void>;
    loadPrevious: () => Promise<void>;
    renderRoot: HTMLElement | DocumentFragment;
} & TResult;

function internals(element: UniversalSearch): UniversalSearchTestApi {
    return element as unknown as UniversalSearchTestApi;
}

function productsTab(element: UniversalSearch): TabTestApi<{ products: ProductResult[] }> {
    return queryDeep(element, 'relewise-universal-search-products-tab')! as unknown as TabTestApi<{ products: ProductResult[] }>;
}

function products(element: UniversalSearch): ProductResult[] {
    return productsTab(element)?.products ?? [];
}

function productCategoriesTab(element: UniversalSearch): TabTestApi<{ productCategories: ProductCategoryResult[] }> {
    return queryDeep(element, 'relewise-universal-search-product-categories-tab')! as unknown as TabTestApi<{ productCategories: ProductCategoryResult[] }>;
}

function productCategories(element: UniversalSearch): ProductCategoryResult[] {
    return productCategoriesTab(element)?.productCategories ?? [];
}

function contentTab(element: UniversalSearch): TabTestApi<{ content: ContentResult[] }> {
    return queryDeep(element, 'relewise-universal-search-content-tab')! as unknown as TabTestApi<{ content: ContentResult[] }>;
}

function contentResults(element: UniversalSearch): ContentResult[] {
    return contentTab(element)?.content ?? [];
}

function queryAllDeep<T extends Element>(root: Element | DocumentFragment, selector: string): T[] {
    const matches = [...root.querySelectorAll<T>(selector)];
    root.querySelectorAll<HTMLElement>('*').forEach(element => {
        if (element.shadowRoot) {
            matches.push(...queryAllDeep<T>(element.shadowRoot, selector));
        }
    });
    return matches;
}

function queryDeep<T extends Element = Element>(element: UniversalSearch, selector: string): T | null {
    return queryAllDeep<T>(element.renderRoot, selector)[0] ?? null;
}

async function universalSearchUpdated(element: UniversalSearch): Promise<void> {
    await element.updateComplete;
    for (let depth = 0; depth < 2; depth++) {
        const nestedComponents = queryAllDeep<HTMLElement>(element.renderRoot, '*')
            .filter((component): component is HTMLElement & { updateComplete: Promise<boolean> } => 'updateComplete' in component);
        await Promise.all(nestedComponents.map(component => component.updateComplete));
    }
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
        Searcher.prototype.batch = async function(requestCollection, options) {
            const responses = await Promise.all(requestCollection.requests.map(request => {
                if (request.$type.includes('ProductCategorySearchRequest')) {
                    return this.searchProductCategories(request as any, options);
                }
                if (request.$type.includes('ContentSearchRequest')) {
                    return this.searchContents(request as any, options);
                }
                return this.searchProducts(request as any, options);
            }));

            return { responses: responses.filter(response => Boolean(response)) } as any;
        };
        useSearch({ debounceTimeInMs: 0, universalSearch: {} });
    });

    teardown(() => {
        // URL state is reset in setup. Repeating the History API cleanup here
        // can exceed WebKit's replacement limit in this large test suite.
        fixtureCleanup();
        window.relewiseUISearchOptions = undefined!;
        window.relewiseUIOptions = undefined!;
        Searcher.prototype.searchProducts = originalSearchProducts;
        Searcher.prototype.searchProductCategories = originalSearchProductCategories;
        Searcher.prototype.searchContents = originalSearchContents;
        Searcher.prototype.batch = originalBatch;
    });

    test('derives the ordered tabs from the supported entity ids', () => {
        assert.deepEqual(universalSearchTabs, [
            'products',
            'productCategories',
            'content',
        ]);
    });

    test('skips history replacements when URL state is unchanged', () => {
        const originalReplaceState = window.history.replaceState;
        let replaceStateCalls = 0;
        window.history.replaceState = (data: unknown, unused: string, url?: string | URL | null) => {
            replaceStateCalls++;
            originalReplaceState.call(window.history, data, unused, url);
        };

        try {
            const missingQueryKey = 'rw-missing-test-key';
            updateUrlState(missingQueryKey, null);
            updateUrlStateValues(missingQueryKey, []);
            updateUrlStateForUniversalSearchTerm(readCurrentUrlState(QueryKeys.term) ?? '');

            assert.equal(replaceStateCalls, 0);
        } finally {
            window.history.replaceState = originalReplaceState;
        }
    });

    test('is registered through useSearch', () => {
        assert.isDefined(customElements.get('relewise-universal-search'));
        assert.isDefined(customElements.get('relewise-search-combobox'));
    });

    test('respects configured light DOM rendering', async () => {
        const options = mockRelewiseOptions();
        options.components = { domMode: 'light' };
        initializeRelewiseUI(options);
        useSearch({ debounceTimeInMs: 0, universalSearch: {} });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;
        await universalSearchUpdated(el);

        assert.isNull(el.shadowRoot);
        assert.isNotNull(el.querySelector('[role="dialog"]'));
    });

    test('renders the zero-result treatment in light DOM', async() => {
        Searcher.prototype.searchProducts = async function() {
            return productSearchResponse([], 0);
        };
        const options = mockRelewiseOptions();
        options.components = { domMode: 'light' };
        initializeRelewiseUI(options);
        useSearch({ debounceTimeInMs: 0, universalSearch: { entities: { products: {} } } });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        internals(el).setSearchTerm('shoe');
        await waitUntil(() => el.querySelector('[part="zero-results-hint"]') !== null);

        assert.isNull(el.shadowRoot);
        assert.equal(el.querySelector('[part="zero-results-title"]')?.textContent?.trim(), 'No products found.');
        assert.equal(el.querySelector('[part="zero-results-hint"]')?.textContent?.trim(), 'Try another search term or check the spelling.');
    });

    test('restores the open Universal Search state from a URL term', async () => {
        Searcher.prototype.searchProducts = async function() {
            return productSearchResponse([], 0);
        };
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ debounceTimeInMs: 0, universalSearch: { entities: { products: {} } } });

        updateUrlState(QueryKeys.term, 'shoe');

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search"></relewise-universal-search>
        `) as UniversalSearch;

        assert.equal(internals(el).term, 'shoe');
        assert.isTrue(el.isOpen);
        assert.isTrue(el.hasAttribute('open'));
    });

    test('opens and closes through methods', async () => {
        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search"></relewise-universal-search>
        `) as UniversalSearch;

        el.open();
        await universalSearchUpdated(el);

        assert.isTrue(el.isOpen);
        assert.isTrue(el.hasAttribute('open'));
        assert.isNotNull(queryDeep(el, '[role="dialog"]'));

        el.close();
        await universalSearchUpdated(el);

        assert.isFalse(el.isOpen);
        assert.isFalse(el.hasAttribute('open'));
        assert.isNull(queryDeep(el, '[role="dialog"]'));
    });

    test('locks document scrolling while open and restores existing inline values', async () => {
        const originalDocumentElementOverflow = document.documentElement.style.overflow;
        const originalBodyOverflow = document.body.style.overflow;
        document.documentElement.style.overflow = 'auto';
        document.body.style.overflow = 'scroll';

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search"></relewise-universal-search>
        `) as UniversalSearch;

        try {
            el.open();
            await universalSearchUpdated(el);

            assert.equal(document.documentElement.style.overflow, 'hidden');
            assert.equal(document.body.style.overflow, 'hidden');

            el.close();
            await universalSearchUpdated(el);

            assert.equal(document.documentElement.style.overflow, 'auto');
            assert.equal(document.body.style.overflow, 'scroll');
        } finally {
            el.close();
            document.documentElement.style.overflow = originalDocumentElementOverflow;
            document.body.style.overflow = originalBodyOverflow;
        }
    });

    test('keeps document scrolling locked until every open instance closes or disconnects', async () => {
        const originalDocumentElementOverflow = document.documentElement.style.overflow;
        const originalBodyOverflow = document.body.style.overflow;
        document.documentElement.style.overflow = 'auto';
        document.body.style.overflow = 'scroll';

        const first = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search"></relewise-universal-search>
        `) as UniversalSearch;
        const second = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search"></relewise-universal-search>
        `) as UniversalSearch;

        try {
            first.open();
            second.open();
            await Promise.all([universalSearchUpdated(first), universalSearchUpdated(second)]);

            first.close();
            await universalSearchUpdated(first);
            assert.equal(document.documentElement.style.overflow, 'hidden');
            assert.equal(document.body.style.overflow, 'hidden');

            second.remove();
            assert.equal(document.documentElement.style.overflow, 'auto');
            assert.equal(document.body.style.overflow, 'scroll');
        } finally {
            first.close();
            second.remove();
            document.documentElement.style.overflow = originalDocumentElementOverflow;
            document.body.style.overflow = originalBodyOverflow;
        }
    });

    test('locks body scrolling while a facets drawer is open', async () => {
        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;
        const body = el.renderRoot.querySelector<HTMLElement>('.rw-body')!;

        body.dispatchEvent(new CustomEvent('universal-search-facets-drawer-state-changed', {
            bubbles: true,
            composed: true,
            detail: { open: true },
        }));
        await el.updateComplete;
        assert.isTrue(body.classList.contains('rw-facets-open'));

        body.dispatchEvent(new CustomEvent('universal-search-facets-drawer-state-changed', {
            bubbles: true,
            composed: true,
            detail: { open: false },
        }));
        await el.updateComplete;
        assert.isFalse(body.classList.contains('rw-facets-open'));
    });

    test('contains focus while open and restores focus when closed', async () => {
        const opener = await fixture<HTMLButtonElement>(html`<button type="button">Open search</button>`);
        opener.focus();

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search"></relewise-universal-search>
        `) as UniversalSearch;

        el.open();
        await universalSearchUpdated(el);

        const searchCombobox = queryDeep(el, 'relewise-search-combobox')! as HTMLElement & { updateComplete: Promise<boolean>; shadowRoot: ShadowRoot };
        const closeButton = queryDeep(el, 'relewise-button[part="close-button"]')! as Button;
        await searchCombobox.updateComplete;
        await closeButton.updateComplete;

        const searchInput = searchCombobox.shadowRoot!.querySelector('input')!;
        const closeButtonElement = closeButton.shadowRoot!.querySelector('button')!;

        closeButtonElement.focus();
        closeButtonElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, composed: true }));
        assert.equal(searchCombobox.shadowRoot!.activeElement, searchInput);

        searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, composed: true }));
        assert.equal(closeButton.shadowRoot!.activeElement, closeButtonElement);

        el.close();
        await universalSearchUpdated(el);

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

        internals(debouncingElement).setSearchTerm('boot');
        debouncingElement.remove();
        await new Promise(resolve => setTimeout(resolve, 30));

        assert.isNull(readCurrentUrlState(QueryKeys.term));
    });

    test('opens through the open attribute', async () => {
        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        assert.isTrue(el.isOpen);
        assert.isNotNull(queryDeep(el, '[role="dialog"]'));
    });

    test('runs open and close lifecycle when the open attribute changes', async () => {
        let searchCount = 0;
        let abortSignal: AbortSignal | null = null;

        Searcher.prototype.searchProducts = async function(_request, options) {
            searchCount++;
            abortSignal = options?.abortSignal ?? null;
            return productSearchResponse([product('1')]);
        };

        updateUrlState(QueryKeys.term, 'shoe');
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ debounceTimeInMs: 0, universalSearch: { entities: { products: {} } } });

        const opener = await fixture<HTMLButtonElement>(html`<button type="button">Open search</button>`);
        opener.focus();
        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search"></relewise-universal-search>
        `) as UniversalSearch;

        el.setAttribute('open', '');
        await waitUntil(() => searchCount === 1, 'search was not started after adding the open attribute');

        assert.isTrue(el.isOpen);
        assert.isNotNull(queryDeep(el, '[role="dialog"]'));

        el.removeAttribute('open');
        await universalSearchUpdated(el);

        assert.isFalse(el.isOpen);
        assert.isTrue(abortSignal!.aborted);
        assert.equal(document.activeElement, opener);
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

        const closeButton = queryDeep(el, 'relewise-button[part="close-button"]');
        const emptyState = queryDeep(el, '[part="empty-state"]');

        assert.equal(closeButton?.getAttribute('button-text'), 'Luk');
        assert.equal(emptyState?.textContent?.trim(), 'Begynd at søge.');

        internals(el).setSearchTerm('sko');
        await waitUntil(() => queryDeep(el, '[part="empty-state"]')?.textContent?.includes('Ingen faner konfigureret.'), 'no tabs text was not localized');
    });

    test('closes on Escape', async () => {
        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        await universalSearchUpdated(el);

        assert.isFalse(el.isOpen);
    });

    test('writes term to URL state', async () => {
        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        internals(el).setSearchTerm('shoe');

        await waitUntil(() => readCurrentUrlState(QueryKeys.term) === 'shoe', 'term was not written to URL state');
    });

    test('does not render tabs without a search term', async () => {
        useSearch({ debounceTimeInMs: 0, universalSearch: { entities: { products: {} } } });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        assert.isNull(queryDeep(el, '[part="tabs"]'));
        assert.include(queryDeep(el, '[part="empty-state"]')?.textContent ?? '', 'Start typing to search.');
    });

    test('searches products by default when entities are omitted', async () => {
        let productSearchCount = 0;
        let productCategorySearchCount = 0;
        let contentSearchCount = 0;
        let batchSearchCount = 0;
        const batch = Searcher.prototype.batch;
        Searcher.prototype.batch = async function(requestCollection, options) {
            batchSearchCount++;
            return batch.call(this, requestCollection, options);
        };

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

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ debounceTimeInMs: 0, universalSearch: {} });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        internals(el).setSearchTerm('shoe');
        await waitUntil(() => products(el).length === 1, 'default product results were not loaded');

        assert.equal(productSearchCount, 1);
        assert.equal(productCategorySearchCount, 0);
        assert.equal(contentSearchCount, 0);
        assert.equal(batchSearchCount, 1);
        assert.equal(queryAllDeep(el.renderRoot, '[part="tab"]').length, 1);
        assert.include(queryDeep(el, '[part="tab"]')?.textContent ?? '', 'Products');
        assert.equal(
            getComputedStyle(queryDeep<HTMLElement>(el, '[part="header"]')!).borderBottomColor,
            'rgb(238, 238, 238)',
        );
        assert.equal(
            getComputedStyle(queryDeep<HTMLElement>(el, '[part="tabs"]')!).borderBottomColor,
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

        internals(el).setSearchTerm('shoe');

        await waitUntil(() => products(el).length === 1, 'products were not rendered');

        assert.equal(capturedTerm, 'shoe');
        assert.isNotNull(queryDeep(el, '[part="tabs"]'));
        assert.equal(queryAllDeep(el.renderRoot, 'relewise-product-tile').length, 1);
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

        internals(el).setSearchTerm('shoe');
        await universalSearchUpdated(el);

        assert.isNull(queryDeep(el, '[part="zero-results"]'));

        await waitUntil(() => queryDeep(el, '[part="zero-results"]') !== null, 'zero-results was not rendered after search response');
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

        internals(el).setSearchTerm('shoe');
        await waitUntil(() => products(el).length === 1, 'initial products were not rendered');

        internals(el).setSearchTerm('boot');
        await universalSearchUpdated(el);

        assert.equal(products(el).length, 0);
        assert.equal(queryAllDeep(el.renderRoot, 'relewise-product-tile').length, 0);

        await waitUntil(() => products(el).length === 1, 'new products were not rendered');
        assert.equal(products(el)[0].productId, 'boot');
    });

    test('ignores an aborted response that resolves after a newer search', async () => {
        const pendingResponses = new Map<string, (response: ReturnType<typeof productSearchResponse>) => void>();

        Searcher.prototype.searchProducts = function(request) {
            return new Promise(resolve => pendingResponses.set(request.term ?? '', resolve));
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ debounceTimeInMs: 0, universalSearch: { entities: { products: {} } } });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        internals(el).setSearchTerm('shoe');
        await waitUntil(() => pendingResponses.has('shoe'), 'first search was not started');

        internals(el).setSearchTerm('boot');
        await waitUntil(() => pendingResponses.has('boot'), 'second search was not started');

        pendingResponses.get('shoe')!(productSearchResponse([product('stale')]));
        await new Promise(resolve => setTimeout(resolve, 0));

        assert.equal(products(el).length, 0);

        pendingResponses.get('boot')!(productSearchResponse([product('current')]));
        await waitUntil(() => products(el).length === 1, 'current search response was not applied');

        assert.equal(products(el)[0].productId, 'current');
    });

    test('recreates facet and sorting controls when the search term changes', async () => {
        Searcher.prototype.searchProducts = async function(request) {
            return productSearchResponse([product(request.term ?? 'missing')], 1, multiOptionFacetResult());
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ debounceTimeInMs: 0, universalSearch: { entities: { products: {} } } });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        internals(el).setSearchTerm('shoe');
        await waitUntil(() => products(el)[0]?.productId === 'shoe', 'initial controls were not rendered');

        const initialFacets = queryDeep(el, 'relewise-facets');
        const initialSorting = queryDeep(el, 'relewise-product-search-sorting');
        assert.isNotNull(initialFacets);
        assert.isNotNull(initialSorting);

        internals(el).setSearchTerm('boot');
        await waitUntil(() => products(el)[0]?.productId === 'boot', 'updated controls were not rendered');

        assert.notEqual(queryDeep(el, 'relewise-facets'), initialFacets);
        assert.notEqual(queryDeep(el, 'relewise-product-search-sorting'), initialSorting);
    });

    test('clears facet URL state when the search term changes', async () => {
        Searcher.prototype.searchProducts = async function() {
            return productSearchResponse([], 0);
        };

        const url = new URL(window.location.href);
        url.searchParams.append(QueryKeys.facet + 'Brand', 'Adidas');
        url.searchParams.append(QueryKeys.facet + 'Brand', 'Nike');
        url.searchParams.append(QueryKeys.productFacet + 'Brand', 'Adidas');
        url.searchParams.append(QueryKeys.productFacet + 'Brand', 'Nike');
        url.searchParams.set(QueryKeys.productCategoryFacet + 'DataDepartment', 'Electronics');
        url.searchParams.set(QueryKeys.contentFacet + 'DataTopic', 'Guide');
        url.searchParams.set(QueryKeys.productTake, '4');
        url.searchParams.set(QueryKeys.productCategoryTake, '4');
        url.searchParams.set(QueryKeys.contentTake, '4');
        url.searchParams.set(QueryKeys.sortBy, 'price');
        url.searchParams.set(QueryKeys.productSorting, 'SalesPriceAsc');
        window.history.replaceState({}, document.title, url);

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ debounceTimeInMs: 0, universalSearch: { entities: { products: {} } } });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        internals(el).setSearchTerm('boot');

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

    test('uses products tab no-result localization', async () => {
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
                        noResults: 'Ingen varer fundet.',
                        noResultsHint: 'Prøv et andet søgeord, eller kontrollér stavningen.',
                    },
                },
            },
        });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        internals(el).setSearchTerm('sko');
        await waitUntil(() => queryDeep(el, '[part="zero-results"]') !== null, 'zero-results was not rendered');

        assert.equal(queryDeep(el, '[part="tabs"]')?.getAttribute('aria-label'), 'Søgeresultatfaner');
        assert.include(queryDeep(el, '[part="tab"]')?.textContent ?? '', 'Varer');
        assert.include(queryDeep(el, '[part="results-summary"]')?.textContent ?? '', 'Søgeresultater for');
        assert.isNull(queryDeep(el, '[part="results-header"]'));
        assert.equal(queryDeep(el, '[part="zero-results-title"]')?.textContent?.trim(), 'Ingen varer fundet.');
        assert.equal(
            queryDeep(el, '[part="zero-results-hint"]')?.textContent?.trim(),
            'Prøv et andet søgeord, eller kontrollér stavningen.',
        );
    });

    test('uses products tab result localization when results exist', async() => {
        Searcher.prototype.searchProducts = async function() {
            return productSearchResponse([product('shoe')], 1);
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: { entities: { products: { pageSize: 2 } } },
            localization: {
                universalSearch: {
                    products: {
                        resultsTitle: 'Vareresultater',
                        result: 'vare',
                        results: 'varer',
                    },
                },
            },
        });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        internals(el).setSearchTerm('sko');
        await waitUntil(() => queryDeep(el, '[part="product-tile"]') !== null, 'product result was not rendered');

        assert.equal(queryDeep(el, '[part="results-title"]')?.textContent?.trim(), 'Vareresultater');
        assert.equal(queryDeep(el, '[part="results-count"]')?.textContent?.trim(), '1 vare');
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

        internals(el).setSearchTerm('shoe');
        await waitUntil(() => queryDeep(el, '[part="zero-results"]') !== null, 'zero-results was not rendered');

        assert.include(queryDeep(el, '[part="tab"]')?.textContent ?? '', 'Items');
        assert.include(queryDeep(el, '[part="results-summary"]')?.textContent ?? '', 'Search results for');
        assert.isNull(queryDeep(el, '[part="results-header"]'));
        assert.equal(queryDeep(el, '[part="zero-results-title"]')?.textContent?.trim(), 'No products found.');
        assert.equal(
            queryDeep(el, '[part="zero-results-hint"]')?.textContent?.trim(),
            'Try another search term or check the spelling.',
        );
    });

    test('allows the tab no-result hint to be omitted', async() => {
        Searcher.prototype.searchProducts = async function() {
            return productSearchResponse([], 0);
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: { entities: { products: {} } },
            localization: {
                universalSearch: {
                    products: {
                        noResultsHint: '',
                    },
                },
            },
        });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        internals(el).setSearchTerm('shoe');
        await waitUntil(() => queryDeep(el, '[part="zero-results"]') !== null, 'zero-results was not rendered');

        assert.isNull(queryDeep(el, '[part="zero-results-hint"]'));
    });

    test('does not render facets or reserve their column when a tab has zero results', async () => {
        const facets = { items: [] };

        Searcher.prototype.searchProducts = async function() {
            return productSearchResponse([], 0, facets);
        };
        Searcher.prototype.searchProductCategories = async function() {
            return productCategorySearchResponse([], 0, facets);
        };
        Searcher.prototype.searchContents = async function() {
            return contentSearchResponse([], 0, facets);
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

        internals(el).setSearchTerm('shoe');
        await waitUntil(
            () => products(el).length === 0
                && queryDeep(el, 'relewise-universal-search-products-tab') !== null
                && queryDeep(el, 'relewise-universal-search-product-categories-tab') !== null
                && queryDeep(el, 'relewise-universal-search-content-tab') !== null
                && productsTab(el).result !== null
                && productCategoriesTab(el).result !== null
                && contentTab(el).result !== null,
            'zero-result searches did not complete',
        );

        assert.isNull(queryDeep(el, 'relewise-facets'));
        assert.isNull(queryDeep(el, 'relewise-product-search-sorting'));
        assert.isNull(productsTab(el).renderRoot.querySelector('[part="results-header"]'));
        assert.isNotNull(productsTab(el).renderRoot.querySelector('[part="zero-results"]'));

        internals(el).handleSelectTab('productCategories');
        await universalSearchUpdated(el);
        assert.isNull(queryDeep(el, 'relewise-facets'));
        assert.isNull(productCategoriesTab(el).renderRoot.querySelector('[part="results-header"]'));
        assert.isNotNull(productCategoriesTab(el).renderRoot.querySelector('[part="zero-results"]'));

        internals(el).handleSelectTab('content');
        await universalSearchUpdated(el);
        assert.isNull(queryDeep(el, 'relewise-facets'));
        assert.isNull(contentTab(el).renderRoot.querySelector('[part="results-header"]'));
        assert.isNotNull(contentTab(el).renderRoot.querySelector('[part="zero-results"]'));
    });

    test('keeps the wide product header close to the results when facets are taller', async () => {
        Searcher.prototype.searchProducts = async function() {
            return productSearchResponse([product('1')], 1, multiOptionFacetResult());
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: { entities: { products: {} } },
        });
        const el = await fixture<UniversalSearch>(html`
            <relewise-universal-search
                open
                style="--relewise-universal-search-width: 70rem;">
            </relewise-universal-search>
        `);

        internals(el).setSearchTerm('shoe');
        await waitUntil(() => products(el).length === 1);
        await universalSearchUpdated(el);

        const productLayout = productsTab(el).renderRoot.querySelector<HTMLElement>('[part="results-layout"]')!;
        const facets = productsTab(el).renderRoot.querySelector<HTMLElement>('[part="facets"]')!;
        const resultsHeader = productsTab(el).renderRoot.querySelector<HTMLElement>('[part="results-header"]')!;
        const results = productsTab(el).renderRoot.querySelector<HTMLElement>('[part="results"]')!;
        facets.style.height = '30rem';

        const rowGap = parseFloat(getComputedStyle(productLayout).rowGap);
        const maximumHeaderHeight = parseFloat(getComputedStyle(productLayout).fontSize) * 3;

        assert.isAtMost(resultsHeader.getBoundingClientRect().height, maximumHeaderHeight);
        assert.closeTo(results.getBoundingClientRect().top - resultsHeader.getBoundingClientRect().bottom, rowGap, 1);
    });

    test('uses progressively denser default product columns as the dialog widens', async () => {
        Searcher.prototype.searchProducts = async function() {
            return productSearchResponse([product('1'), product('2'), product('3')], 3, { items: [] });
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: { entities: { products: {} } },
        });
        const el = await fixture<UniversalSearch>(html`
            <relewise-universal-search
                open
                style="--relewise-universal-search-width: 60rem;">
            </relewise-universal-search>
        `);

        internals(el).setSearchTerm('shoe');
        await waitUntil(() => products(el).length === 3);
        await universalSearchUpdated(el);
        const productGrid = productsTab(el).renderRoot.querySelector<HTMLElement>('[part="product-grid"]')!;

        assert.equal(getComputedStyle(productGrid).gridTemplateColumns.split(' ').length, 3);

        el.style.setProperty('--relewise-universal-search-width', '40rem');
        await new Promise(requestAnimationFrame);
        assert.equal(getComputedStyle(productGrid).gridTemplateColumns.split(' ').length, 2);

        el.style.setProperty('--relewise-universal-search-width', '20rem');
        await new Promise(requestAnimationFrame);
        assert.equal(getComputedStyle(productGrid).gridTemplateColumns.split(' ').length, 1);
    });

    test('uses entity-specific compact columns without overflowing the result layout', async () => {
        Searcher.prototype.searchProducts = async function() {
            return productSearchResponse([product('1'), product('2'), product('3')], 3, multiOptionFacetResult());
        };
        Searcher.prototype.searchProductCategories = async function() {
            return productCategorySearchResponse(
                [productCategory('1'), productCategory('2'), productCategory('3')],
                3,
                multiOptionFacetResult(),
            );
        };
        Searcher.prototype.searchContents = async function() {
            return contentSearchResponse([content('1'), content('2'), content('3')], 3, multiOptionFacetResult());
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {}, productCategories: {}, content: {} },
            },
        });
        const el = await fixture<UniversalSearch>(html`
            <relewise-universal-search
                open
                style="
                    --relewise-universal-search-width: 30rem;
                    --relewise-universal-search-mobile-product-columns: 1;
                    --relewise-universal-search-mobile-category-columns: 2;
                    --relewise-universal-search-mobile-content-columns: 3;
                ">
            </relewise-universal-search>
        `);

        internals(el).setSearchTerm('shoe');
        await waitUntil(() => products(el).length === 3 && productCategories(el).length === 3 && contentResults(el).length === 3);
        await universalSearchUpdated(el);

        const productGrid = productsTab(el).renderRoot.querySelector<HTMLElement>('[part="product-grid"]')!;
        const productLayout = productsTab(el).renderRoot.querySelector<HTMLElement>('[part="results-layout"]')!;
        const facets = productsTab(el).renderRoot.querySelector('relewise-universal-search-facets') as any;
        const facetTrigger = facets.renderRoot.querySelector('[part="facet-trigger"]') as HTMLElement;
        const sorting = productsTab(el).renderRoot.querySelector<HTMLElement>('[part="sorting"]')!;
        const sortingComponent = sorting.querySelector<any>('relewise-product-search-sorting')!;
        const sortingLabel = sortingComponent.renderRoot.querySelector('[part="label"]') as HTMLElement;
        const sortingSelect = sortingComponent.renderRoot.querySelector('[part="select"]') as HTMLSelectElement;
        const sortingChevron = sorting.querySelector<HTMLElement>('.rw-sorting-chevron')!;
        const resultsSummary = el.renderRoot.querySelector<HTMLElement>('[part="results-summary"]')!;
        const resultsSummaryStyles = getComputedStyle(resultsSummary);
        const controls = [...productLayout.children]
            .filter(control => control.matches('[part="facets"], [part="sorting"]'))
            .map(control => control.getAttribute('part'));
        assert.deepEqual(controls, ['facets', 'sorting']);
        assert.equal(getComputedStyle(productGrid).gridTemplateColumns.split(' ').length, 1);
        assert.closeTo(facetTrigger.getBoundingClientRect().top, sorting.getBoundingClientRect().top, 1);
        assert.closeTo(facetTrigger.getBoundingClientRect().height, sorting.getBoundingClientRect().height, 1);
        assert.isBelow(facetTrigger.getBoundingClientRect().right, sorting.getBoundingClientRect().left);
        assert.equal(getComputedStyle(sortingLabel).position, 'absolute');
        assert.equal(getComputedStyle(sortingLabel).width, '1px');
        assert.equal(getComputedStyle(sortingSelect).appearance, 'none');
        assert.equal(getComputedStyle(sortingChevron).pointerEvents, 'none');
        assert.equal(getComputedStyle(sortingSelect).textAlignLast, 'center');
        assert.equal(getComputedStyle(sortingSelect.options[0]).textAlign, 'start');
        assert.equal(resultsSummaryStyles.textAlign, 'center');
        assert.equal(resultsSummaryStyles.marginTop, resultsSummaryStyles.marginBottom);
        assert.isAtMost(productGrid.scrollWidth, productGrid.clientWidth);

        sorting.dir = 'rtl';
        await new Promise(requestAnimationFrame);
        const rtlSelectStyles = getComputedStyle(sortingSelect);
        const rtlChevronStyles = getComputedStyle(sortingChevron);
        assert.isAbove(parseFloat(rtlSelectStyles.paddingLeft), parseFloat(rtlSelectStyles.paddingRight));
        assert.isBelow(parseFloat(rtlChevronStyles.left), parseFloat(rtlChevronStyles.right));

        internals(el).handleSelectTab('productCategories');
        await universalSearchUpdated(el);
        const categoryGrid = productCategoriesTab(el).renderRoot.querySelector<HTMLElement>('[part="category-grid"]')!;
        const categoryLayout = productCategoriesTab(el).renderRoot.querySelector<HTMLElement>('[part="results-layout"]')!;
        const categoryFacets = productCategoriesTab(el).renderRoot.querySelector('relewise-universal-search-facets') as any;
        const categoryFacetTrigger = categoryFacets.renderRoot.querySelector('[part="facet-trigger"]') as HTMLElement;
        assert.equal(getComputedStyle(categoryGrid).gridTemplateColumns.split(' ').length, 2);
        assert.closeTo(categoryFacetTrigger.getBoundingClientRect().width, categoryLayout.getBoundingClientRect().width, 1);
        assert.isAtMost(categoryGrid.scrollWidth, categoryGrid.clientWidth);

        internals(el).handleSelectTab('content');
        await universalSearchUpdated(el);
        const contentGrid = contentTab(el).renderRoot.querySelector<HTMLElement>('[part="content-grid"]')!;
        const contentLayout = contentTab(el).renderRoot.querySelector<HTMLElement>('[part="results-layout"]')!;
        const contentFacets = contentTab(el).renderRoot.querySelector('relewise-universal-search-facets') as any;
        const contentFacetTrigger = contentFacets.renderRoot.querySelector('[part="facet-trigger"]') as HTMLElement;
        assert.equal(getComputedStyle(contentGrid).gridTemplateColumns.split(' ').length, 3);
        assert.closeTo(contentFacetTrigger.getBoundingClientRect().width, contentLayout.getBoundingClientRect().width, 1);
        assert.isAtMost(contentGrid.scrollWidth, contentGrid.clientWidth);
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

        internals(el).setSearchTerm('shoe');
        await waitUntil(() => products(el).length === 2, 'initial products were not rendered');

        void productsTab(el).loadMore();
        await waitUntil(() => products(el).length === 3, 'more products were not appended');

        assert.equal(readCurrentUrlState(QueryKeys.productTake), '3');
        assert.isNull(readCurrentUrlState(QueryKeys.take));
        assert.equal(queryAllDeep(el.renderRoot, 'relewise-product-tile').length, 3);
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

        internals(el).setSearchTerm('shoe');
        await waitUntil(() => products(el).length === 2, 'initial products were not rendered');

        void productsTab(el).loadMore();
        void productsTab(el).loadMore();
        await waitUntil(() => searchCount === 2, 'load-more request was not started');
        await universalSearchUpdated(el);

        assert.equal(searchCount, 2);
        assert.isNull(readCurrentUrlState(QueryKeys.productTake));
        assert.isNull(queryDeep(el, '[part="load-more"]'));

        resolveLoadMore(productSearchResponse([product('3'), product('4')], 6));
        await waitUntil(() => products(el).length === 4, 'load-more products were not rendered');
        assert.equal(readCurrentUrlState(QueryKeys.productTake), '4');
    });

    test('retries the same pagination when load more fails', async () => {
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

        internals(el).setSearchTerm('shoe');
        await waitUntil(() => products(el).length === 2, 'initial products were not rendered');

        await productsTab(el).loadMore();

        assert.isNull(readCurrentUrlState(QueryKeys.productTake));

        await productsTab(el).loadMore();

        assert.deepEqual(requestedPages, [1, 2, 2]);
        assert.equal(readCurrentUrlState(QueryKeys.productTake), '4');
        assert.deepEqual(products(el).map(result => result.productId), ['1', '2', '3', '4']);
    });

    test('restores a large product take from the last page and exposes both paging directions', async () => {
        const requestedPagination: Array<{ skip: number; take: number }> = [];
        const totalProducts = 10_030;

        Searcher.prototype.searchProducts = async function(request) {
            const skip = (request as any).skip as number;
            const take = (request as any).take as number;
            requestedPagination.push({ skip, take });

            return productSearchResponse(
                Array.from({ length: take }, (_, index) => product((skip + index + 1).toString())),
                totalProducts,
            );
        };

        window.history.pushState({}, '', `?${QueryKeys.term}=shoe&${QueryKeys.productTake}=10000`);

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: { entities: { products: { pageSize: 15 } } },
            localization: { loadMoreButton: { loadPrevious: 'Load earlier products' } },
        });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        await waitUntil(() => products(el).length === 15, 'last product page was not restored');
        await universalSearchUpdated(el);

        assert.deepEqual(requestedPagination, [{ skip: 9985, take: 15 }]);
        assert.equal(productsTab(el).resultOffset, 9985);
        assert.equal(products(el)[0].productId, '9986');
        assert.equal(products(el)[14].productId, '10000');
        assert.equal(readCurrentUrlState(QueryKeys.productTake), '10000');

        const loadPrevious = queryDeep<HTMLElement>(el, '[part="load-previous"]');
        assert.exists(loadPrevious);
        assert.include(loadPrevious?.textContent ?? '', 'Load earlier products');
        assert.equal(getComputedStyle(loadPrevious!).marginTop, '0px');
        assert.isAbove(parseFloat(getComputedStyle(loadPrevious!).marginBottom), 0);

        const loadNext = queryDeep<HTMLElement>(el, '[part="load-more"]');
        assert.exists(loadNext);

        await productsTab(el).loadPrevious();

        assert.deepEqual(requestedPagination[1], { skip: 9970, take: 15 });
        assert.equal(productsTab(el).resultOffset, 9970);
        assert.equal(products(el).length, 30);
        assert.equal(products(el)[0].productId, '9971');
        assert.equal(products(el)[29].productId, '10000');
        assert.equal(readCurrentUrlState(QueryKeys.productTake), '10000');
    });

    test('restores the actual final product page when a saved window exceeds the current hits', async () => {
        const requestedPagination: Array<{ skip: number; take: number }> = [];
        const totalProducts = 23;

        Searcher.prototype.searchProducts = async function(request) {
            const skip = (request as any).skip as number;
            const take = (request as any).take as number;
            requestedPagination.push({ skip, take });
            const available = Math.max(0, Math.min(take, totalProducts - skip));

            return productSearchResponse(
                Array.from({ length: available }, (_, index) => product((skip + index + 1).toString())),
                totalProducts,
            );
        };

        window.history.pushState({}, '', `?${QueryKeys.term}=shoe&${QueryKeys.productTake}=10000`);

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: { entities: { products: { pageSize: 15 } } },
        });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        await waitUntil(() => products(el).length === 15, 'actual last product page was restored');
        await universalSearchUpdated(el);

        assert.deepEqual(requestedPagination, [
            { skip: 9985, take: 15 },
            { skip: 8, take: 15 },
        ]);
        assert.equal(productsTab(el).resultOffset, 8);
        assert.equal(products(el)[0].productId, '9');
        assert.equal(products(el)[14].productId, '23');
        assert.equal(readCurrentUrlState(QueryKeys.productTake), '23');
        assert.exists(queryDeep<HTMLElement>(el, '[part="load-previous"]'));
        assert.isNull(queryDeep<HTMLElement>(el, '[part="load-more"]'));
        assert.isNull(queryDeep<HTMLElement>(el, '[part="zero-results"]'));
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

        internals(el).setSearchTerm('guide');
        await waitUntil(() => contentResults(el).length === 2, 'initial content was not rendered');

        void contentTab(el).loadMore();
        await waitUntil(() => contentResults(el).length === 3, 'more content was not appended');

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

        await waitUntil(() => contentResults(el).length === 4, 'initial content URL take was not loaded');

        void contentTab(el).loadMore();
        await waitUntil(() => contentResults(el).length === 6, 'more content was not appended after URL take');

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

        internals(el).setSearchTerm('shoe');
        await waitUntil(() => productCategories(el).length === 2, 'initial product categories were not rendered');

        void productCategoriesTab(el).loadMore();
        await waitUntil(() => productCategories(el).length === 3, 'more product categories were not appended');

        assert.equal(readCurrentUrlState(QueryKeys.productCategoryTake), '4');
    });

    test('batches the initial search for all enabled tabs', async () => {
        let productCategoryRequestCount = 0;
        let contentRequestCount = 0;
        let batchSearchCount = 0;
        let batchedRequestCount = 0;
        const batch = Searcher.prototype.batch;
        Searcher.prototype.batch = async function(requestCollection, options) {
            batchSearchCount++;
            batchedRequestCount = requestCollection.requests.length;
            return batch.call(this, requestCollection, options);
        };

        Searcher.prototype.searchProductCategories = async function() {
            productCategoryRequestCount++;
            return productCategorySearchResponse([productCategory('1')]);
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
                    productCategories: { pageSize: 2 },
                    content: { pageSize: 2 },
                },
            },
        });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        internals(el).setSearchTerm('shoe');
        await waitUntil(() => productCategories(el).length === 1 && contentResults(el).length === 1, 'category and content results were not loaded');

        assert.equal(productCategoryRequestCount, 1);
        assert.equal(contentRequestCount, 1);
        assert.equal(batchSearchCount, 1);
        assert.equal(batchedRequestCount, 2);
        const tabs = queryAllDeep<HTMLElement>(el.renderRoot, '[part="tab"]');
        assert.equal(tabs.length, 2);
        assert.equal(queryDeep(el, '[part="tabs"]')?.getAttribute('role'), 'tablist');
        assert.equal(tabs[0].getAttribute('role'), 'tab');
        assert.equal(tabs[0].tabIndex, 0);
        assert.equal(tabs[1].tabIndex, -1);
        assert.equal(queryAllDeep(el.renderRoot, 'relewise-product-category-tile').length, 1);

        tabs[0].focus();
        tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        await universalSearchUpdated(el);

        const selectedTab = queryDeep<HTMLElement>(el, '[role="tab"][aria-selected="true"]')!;
        const panel = queryDeep<HTMLElement>(el, `#${selectedTab.getAttribute('aria-controls')}`)!;
        assert.equal(internals(el).activeTab, 'content');
        assert.equal((selectedTab.getRootNode() as ShadowRoot).activeElement, selectedTab);
        assert.equal(selectedTab.tabIndex, 0);
        assert.equal(panel.getAttribute('aria-labelledby'), selectedTab.id);
        assert.equal(selectedTab.getAttribute('aria-controls'), panel.id);
        assert.equal(queryAllDeep(el.renderRoot, 'relewise-content-tile').length, 1);
    });

    test('preserves the result component when hiding zero-result tabs', async () => {
        Searcher.prototype.searchProducts = async function() {
            return productSearchResponse([]);
        };
        Searcher.prototype.searchProductCategories = async function() {
            return productCategorySearchResponse([]);
        };
        Searcher.prototype.searchContents = async function() {
            return contentSearchResponse([content('guide')]);
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {}, productCategories: {}, content: {} },
                behavior: { zeroResultTabs: 'hide' },
            },
        });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        internals(el).setSearchTerm('guide');
        await waitUntil(() => contentResults(el).length === 1, 'content result was not preserved');

        const tabs = queryAllDeep<HTMLElement>(el.renderRoot, '[part="tab"]');
        assert.lengthOf(tabs, 1);
        assert.include(tabs[0].textContent ?? '', 'Content');
        assert.equal(internals(el).activeTab, 'content');
        assert.equal(queryAllDeep(el.renderRoot, 'relewise-content-tile').length, 1);
    });

    test('selects the first result tab when the active tab loses its results after a term search', async() => {
        Searcher.prototype.searchProducts = async function(request) {
            return productSearchResponse(request.term === 'war' ? [product('war')] : []);
        };
        Searcher.prototype.searchContents = async function(request) {
            return contentSearchResponse([content(request.term!)]);
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {}, content: {} },
                behavior: {
                    zeroResultTabs: 'show',
                    activateFirstTabWithResults: true,
                },
            },
        });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        internals(el).setSearchTerm('war');
        await waitUntil(() => products(el)[0]?.productId === 'war'
            && contentResults(el)[0]?.contentId === 'war', 'initial results were not rendered');
        assert.equal(internals(el).activeTab, 'products');

        internals(el).setSearchTerm('wardrobe');
        await waitUntil(() => products(el).length === 0
            && contentResults(el)[0]?.contentId === 'wardrobe', 'updated results were not rendered');

        assert.lengthOf(queryAllDeep(el.renderRoot, '[part="tab"]'), 2);
        assert.equal(internals(el).activeTab, 'content');
    });

    test('retains the active zero-result tab when automatic result-tab activation is disabled', async() => {
        Searcher.prototype.searchProducts = async function(request) {
            return productSearchResponse(request.term === 'war' ? [product('war')] : []);
        };
        Searcher.prototype.searchContents = async function(request) {
            return contentSearchResponse([content(request.term!)]);
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {}, content: {} },
                behavior: {
                    zeroResultTabs: 'show',
                    activateFirstTabWithResults: false,
                },
            },
        });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        internals(el).setSearchTerm('war');
        await waitUntil(() => products(el)[0]?.productId === 'war'
            && contentResults(el)[0]?.contentId === 'war', 'initial results were not rendered');

        internals(el).setSearchTerm('wardrobe');
        await waitUntil(() => products(el).length === 0
            && contentResults(el)[0]?.contentId === 'wardrobe', 'updated results were not rendered');

        assert.equal(internals(el).activeTab, 'products');
        assert.exists(productsTab(el).renderRoot.querySelector('[part="zero-results"]'));
    });

    test('selects a remaining result tab after the active tab receives zero results', async () => {
        Searcher.prototype.searchProducts = async function(request) {
            return productSearchResponse(request.term === 'shirt' ? [product('shirt')] : []);
        };
        Searcher.prototype.searchProductCategories = async function() {
            return productCategorySearchResponse([]);
        };
        Searcher.prototype.searchContents = async function(request) {
            return contentSearchResponse(request.term === 'guide' ? [content('guide')] : []);
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {}, productCategories: {}, content: {} },
                behavior: {
                    zeroResultTabs: 'hide',
                    activateFirstTabWithResults: false,
                },
            },
        });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        internals(el).setSearchTerm('shirt');
        await waitUntil(() => products(el).length === 1, 'product result was not rendered');
        assert.equal(internals(el).activeTab, 'products');

        internals(el).setSearchTerm('guide');
        await waitUntil(() => contentResults(el).length === 1, 'content result was not rendered');

        const tabs = queryAllDeep<HTMLElement>(el.renderRoot, '[part="tab"]');
        assert.lengthOf(tabs, 1);
        assert.include(tabs[0].textContent ?? '', 'Content');
        assert.equal(internals(el).activeTab, 'content');
        assert.equal(queryAllDeep(el.renderRoot, 'relewise-product-tile').length, 0);
        assert.equal(queryAllDeep(el.renderRoot, 'relewise-content-tile').length, 1);
    });

    test('renders enabled tabs in configuration order', async () => {
        Searcher.prototype.searchContents = async function() {
            return contentSearchResponse([content('1')]);
        };
        Searcher.prototype.searchProducts = async function() {
            return productSearchResponse([product('1')]);
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: {
                    content: {},
                    products: {},
                },
            },
        });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        internals(el).setSearchTerm('shoe');
        await waitUntil(() => contentResults(el).length === 1 && products(el).length === 1, 'tab results were not loaded');

        const tabs = queryAllDeep<HTMLElement>(el.renderRoot, '[part="tab"]');
        assert.include(tabs[0].textContent ?? '', 'Content');
        assert.include(tabs[1].textContent ?? '', 'Products');
        assert.equal(internals(el).activeTab, 'content');
    });

    test('keeps shared out-of-range price bounds visible on a zero-result tab', async() => {
        const facets = {
            items: [{
                $type: 'Relewise.Client.DataTypes.Search.Facets.Result.PriceRangeFacetResult, Relewise.Client',
                field: 'SalesPrice',
                priceSelectionStrategy: 'Product',
                available: {
                    value: {
                        lowerBoundInclusive: 0,
                        upperBoundInclusive: 246,
                    },
                },
            }],
        };
        Searcher.prototype.searchProducts = async function() {
            return productSearchResponse([], 0, facets);
        };
        Searcher.prototype.searchContents = async function() {
            return contentSearchResponse([content('1')]);
        };
        updateUrlState(QueryKeys.term, 'a');
        updateUrlState(`${QueryKeys.productFacetLowerbound}SalesPrice`, '250');
        updateUrlState(`${QueryKeys.productFacetUpperbound}SalesPrice`, '500');
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            facets: {
                product(builder) {
                    builder.addFacet(
                        facet => facet.addSalesPriceRangeFacet('Product'),
                        { heading: 'Price' },
                    );
                },
            },
            universalSearch: {
                entities: { products: {}, content: {} },
                behavior: { zeroResultTabs: 'hide' },
            },
        });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;
        await waitUntil(() => queryDeep(el, 'relewise-number-range-facet') !== null, 'shared price facet was not rendered');

        const priceFacet = queryDeep(el, 'relewise-number-range-facet')!;
        const inputs = [...priceFacet.shadowRoot!.querySelectorAll<HTMLInputElement>('input')];
        assert.equal(inputs[0].value, '250');
        assert.equal(inputs[1].value, '500');
        assert.equal(inputs[0].min, '');
        assert.equal(inputs[0].max, '');
        assert.equal(inputs[1].min, '');
        assert.equal(inputs[1].max, '');
        assert.equal(internals(el).activeTab, 'products');
        assert.isNotNull(queryDeep(el, '[part="zero-results"]'));
        assert.lengthOf(queryAllDeep<HTMLElement>(el.renderRoot, '[part="tab"]'), 2);
    });

    test('keeps the filtered tab visible when every enabled tab has zero results', async() => {
        const facets = {
            items: [{
                $type: 'Relewise.Client.DataTypes.Search.Facets.Result.ProductDataStringValueFacetResult, Relewise.Client',
                field: 'Data',
                key: 'Color',
                available: [{
                    value: 'red',
                    hits: 0,
                    selected: true,
                }],
            }],
        };
        Searcher.prototype.searchProducts = async function() {
            return productSearchResponse([], 0, facets);
        };
        Searcher.prototype.searchContents = async function() {
            return contentSearchResponse([]);
        };
        updateUrlState(QueryKeys.term, 'shoe');
        updateUrlState(`${QueryKeys.productFacet}DataColor`, 'red');
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            facets: {
                product(builder) {
                    builder.addFacet(facet => facet.addProductDataStringValueFacet('Color', 'Product'), { heading: 'Color' });
                },
            },
            universalSearch: {
                entities: { products: {}, content: {} },
                behavior: { zeroResultTabs: 'hide' },
            },
        });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;
        await waitUntil(() => queryAllDeep(el.renderRoot, '[part="tab"]').length === 1, 'filtered tab was not rendered');

        assert.equal(internals(el).activeTab, 'products');
        assert.isNotNull(queryDeep(el, '[part="facets"]'));
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

        internals(el).setSearchTerm('shoe');
        await waitUntil(() => productCategories(el).length === 1, 'category result was not loaded');

        assert.equal(facetItems?.[0].key, 'Department');
        assert.deepEqual(productCategoriesTab(el).facetLabels, ['Department']);
    });

    test('does not request disabled tabs', async () => {
        let productRequestCount = 0;
        let productCategoryRequestCount = 0;
        let contentRequestCount = 0;

        Searcher.prototype.searchProducts = async function() {
            productRequestCount++;
            return productSearchResponse([]);
        };
        Searcher.prototype.searchProductCategories = async function() {
            productCategoryRequestCount++;
            return productCategorySearchResponse([]);
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

        internals(el).setSearchTerm('shoe');
        await waitUntil(() => contentResults(el).length === 1, 'content result was not loaded');

        assert.equal(productRequestCount, 0);
        assert.equal(productCategoryRequestCount, 0);
        assert.equal(contentRequestCount, 1);
        assert.equal(products(el).length, 0);
        assert.equal(productCategories(el).length, 0);
        assert.equal(queryAllDeep(el.renderRoot, '[part="tab"]').length, 1);
    });

    test('refreshes only the tab whose search configuration changes', async () => {
        let productSearchCount = 0;
        let contentSearchCount = 0;
        let batchSearchCount = 0;
        let resolveContentRefresh: ((response: ReturnType<typeof contentSearchResponse>) => void) | undefined;
        const batch = Searcher.prototype.batch;
        Searcher.prototype.batch = async function(requestCollection, options) {
            batchSearchCount++;
            return batch.call(this, requestCollection, options);
        };

        Searcher.prototype.searchProducts = async function() {
            productSearchCount++;
            return productSearchResponse([product('1')]);
        };

        Searcher.prototype.searchContents = function() {
            contentSearchCount++;
            if (contentSearchCount === 1) {
                return Promise.resolve(contentSearchResponse([content('1')], 1, multiOptionFacetResult()));
            }

            return new Promise(resolve => resolveContentRefresh = resolve);
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

        internals(el).setSearchTerm('shoe');
        await waitUntil(() => products(el).length === 1 && contentResults(el).length === 1, 'initial searches did not complete');

        internals(el).handleSelectTab('content');
        await universalSearchUpdated(el);
        const facets = contentTab(el).renderRoot.querySelector<any>('relewise-universal-search-facets')!;
        (facets.renderRoot.querySelector('.rw-trigger') as HTMLButtonElement)!.click();
        await facets.updateComplete;
        facets.applyFacet();

        await waitUntil(() => contentSearchCount === 2, 'active tab refresh did not start');
        assert.equal(contentTab(el).renderRoot.querySelector('relewise-universal-search-facets'), facets);
        assert.isTrue(facets.renderRoot.querySelector('.rw-drawer')!.hasAttribute('open'));
        assert.equal(contentResults(el)[0].contentId, '1');

        resolveContentRefresh!(contentSearchResponse([content('2')], 1, multiOptionFacetResult()));

        await waitUntil(() => contentResults(el).length === 1 && contentResults(el)[0].contentId === '2', 'active tab search did not replace content results');

        assert.equal(contentTab(el).renderRoot.querySelector('relewise-universal-search-facets'), facets);
        assert.isTrue(facets.renderRoot.querySelector('.rw-drawer')!.hasAttribute('open'));
        assert.equal(productSearchCount, 1);
        assert.equal(contentSearchCount, 2);
        assert.equal(batchSearchCount, 1);
        assert.equal(products(el).length, 1);
        assert.equal(products(el)[0].productId, '1');
    });

    test('refreshes product sorting locally without another batch', async () => {
        let productSearchCount = 0;
        let batchSearchCount = 0;
        const batch = Searcher.prototype.batch;
        Searcher.prototype.batch = async function(requestCollection, options) {
            batchSearchCount++;
            return batch.call(this, requestCollection, options);
        };
        Searcher.prototype.searchProducts = async function() {
            productSearchCount++;
            return productSearchResponse([product(productSearchCount.toString())]);
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ debounceTimeInMs: 0, universalSearch: { entities: { products: {} } } });

        const el = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        internals(el).setSearchTerm('shoe');
        await waitUntil(() => products(el)[0]?.productId === '1', 'initial product search did not complete');

        queryDeep<any>(el, 'relewise-product-search-sorting')!.applySorting();
        await waitUntil(() => products(el)[0]?.productId === '2', 'local sorting search did not complete');

        assert.equal(batchSearchCount, 1);
        assert.equal(productSearchCount, 2);
    });

    test('uses localized errors without hiding successful tabs', async () => {
        let contentSearchCount = 0;
        Searcher.prototype.searchProducts = async function() {
            return productSearchResponse([product('1')]);
        };

        Searcher.prototype.searchContents = async function() {
            contentSearchCount++;
            if (contentSearchCount === 1) {
                return contentSearchResponse([content('1')], 1, multiOptionFacetResult());
            }
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

        internals(el).setSearchTerm('shoe');
        await waitUntil(() => products(el).length === 1 && contentResults(el).length === 1, 'initial results did not load');

        internals(el).handleSelectTab('content');
        contentTab(el).renderRoot.querySelector<any>('relewise-universal-search-facets')!
            .dispatchEvent(new CustomEvent('universal-search-facets-changed'));
        await waitUntil(() => contentTab(el).renderRoot.querySelector('[part="error-state"]') !== null, 'localized error was not rendered');

        assert.equal(contentTab(el).renderRoot.querySelector('[part="error-state"]')?.textContent, 'Could not refresh content.');

        internals(el).handleSelectTab('products');
        await universalSearchUpdated(el);

        assert.isNull(productsTab(el).renderRoot.querySelector('[part="error-state"]'));
        assert.equal(queryAllDeep(el.renderRoot, 'relewise-product-tile').length, 1);
    });
});
