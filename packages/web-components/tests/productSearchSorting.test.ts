import { assert, fixture, html } from '@open-wc/testing';
import { ProductSortingBuilder, Searcher } from '@relewise/client';
import { clearUrlState, initializeRelewiseUI, ProductSearch, ProductSearchSorting, QueryKeys, readCurrentUrlState, registerSearchTarget, SortingEnum, updateUrlState, useSearch } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('product-search-sorting', () => {
    const originalSearchProducts = Searcher.prototype.searchProducts;

    setup(() => {
        clearUrlState();
        Searcher.prototype.searchProducts = originalSearchProducts;
    });

    teardown(() => {
        clearUrlState();
        Searcher.prototype.searchProducts = originalSearchProducts;
    });

    test('renders the seeded default sorting options', async () => {
        useSearch();

        const element = await fixture<ProductSearchSorting>(html`
            <relewise-product-search-sorting></relewise-product-search-sorting>
        `);

        const options = Array.from(element.shadowRoot!.querySelectorAll('option')).map(option => option.value);

        assert.deepEqual(options, [
            'Relevance',
            'SalesPriceAsc',
            'SalesPriceDesc',
            'AlphabeticallyAsc',
            'AlphabeticallyDesc',
        ]);
    });

    test('uses localization for built-in sorting options', async () => {
        useSearch({
            localization: {
                sortingButton: {
                    relevance: 'Most relevant',
                },
            },
        });

        const element = await fixture<ProductSearchSorting>(html`
            <relewise-product-search-sorting></relewise-product-search-sorting>
        `);

        const firstOption = element.shadowRoot!.querySelector('option')!;

        assert.equal(firstOption.textContent?.trim(), 'Most relevant');
    });

    test('renders brand and popularity sorting options from the builder', async () => {
        useSearch({
            sorting: builder => builder
                .clear()
                .addBrandAscending()
                .addPopularityDescending(),
            localization: {
                sortingButton: {
                    brandAscending: 'Brand A-Z',
                    popularityDescending: 'Most popular',
                },
            },
        });

        const element = await fixture<ProductSearchSorting>(html`
            <relewise-product-search-sorting></relewise-product-search-sorting>
        `);

        const options = Array.from(element.shadowRoot!.querySelectorAll('option')).map(option => option.textContent?.trim());

        assert.deepEqual(options, ['Brand A-Z', 'Most popular']);
    });

    test('renders custom sorting options from the builder and updates the URL', async () => {
        useSearch({
            sorting: builder => builder
                .clear()
                .addProductData({
                    label: 'Rating',
                    key: 'Rating',
                    selectionStrategy: 'Product',
                    order: 'Descending',
                    mode: 'Numerical',
                }),
        });

        const element = await fixture<ProductSearchSorting>(html`
            <relewise-product-search-sorting></relewise-product-search-sorting>
        `);

        const select = element.shadowRoot!.querySelector('select') as HTMLSelectElement;
        const options = Array.from(select.querySelectorAll('option')).map(option => option.textContent?.trim());

        assert.deepEqual(options, ['Rating']);

        select.value = 'ProductData:Rating:Product:Descending:Numerical';
        select.dispatchEvent(new Event('change'));
        await element.updateComplete;

        assert.equal(readCurrentUrlState(QueryKeys.sortBy), 'ProductData:Rating:Product:Descending:Numerical');
    });

    test('falls back to the first configured option when the URL contains an unknown id', async () => {
        updateUrlState(QueryKeys.sortBy, 'unknown');

        useSearch({
            sorting: builder => builder
                .clear()
                .addProductData({
                    label: 'Rating',
                    key: 'Rating',
                    selectionStrategy: 'Product',
                    order: 'Descending',
                })
                .addProductData({
                    label: 'Stock',
                    key: 'Stock',
                    selectionStrategy: 'Product',
                    order: 'Ascending',
                }),
        });

        const element = await fixture<ProductSearchSorting>(html`
            <relewise-product-search-sorting></relewise-product-search-sorting>
        `);

        const select = element.shadowRoot!.querySelector('select') as HTMLSelectElement;

        assert.equal(select.value, 'ProductData:Rating:Product:Descending:Auto');
    });

    test('renders targeted sorting options when a target overrides sorting', async () => {
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            sorting: builder => builder
                .clear()
                .addRelevance(),
        });

        registerSearchTarget('campaign', {
            overwriteSorting: builder => builder
                .clear()
                .addBrandAscending()
                .addPopularityDescending(),
        });

        const element = await fixture<ProductSearchSorting>(html`
            <relewise-product-search-sorting target="campaign"></relewise-product-search-sorting>
        `);

        const options = Array.from(element.shadowRoot!.querySelectorAll('option')).map(option => option.value);

        assert.deepEqual(options, [
            SortingEnum.BrandAsc,
            SortingEnum.PopularityDesc,
        ]);
    });

    test('falls back to the first targeted option when the URL contains an unknown id for that target', async () => {
        updateUrlState(QueryKeys.sortBy, SortingEnum.Relevance);

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            sorting: builder => builder
                .clear()
                .addRelevance(),
        });

        registerSearchTarget('campaign', {
            overwriteSorting: builder => builder
                .clear()
                .addProductData({
                    label: 'Rating',
                    key: 'Rating',
                    selectionStrategy: 'Product',
                    order: 'Descending',
                })
                .addPopularityDescending(),
        });

        const element = await fixture<ProductSearchSorting>(html`
            <relewise-product-search-sorting target="campaign"></relewise-product-search-sorting>
        `);

        const select = element.shadowRoot!.querySelector('select') as HTMLSelectElement;

        assert.equal(select.value, 'ProductData:Rating:Product:Descending:Auto');
    });

    test('uses targeted sorting for the product search request when a target overrides sorting', async () => {
        let capturedRequest: { sorting?: unknown } | null = null;

        Searcher.prototype.searchProducts = async function(request) {
            capturedRequest = request;

            return {
                hits: 0,
                results: [],
                facets: null,
            } as any;
        };

        updateUrlState(QueryKeys.sortBy, SortingEnum.PopularityDesc);

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            sorting: builder => builder
                .clear()
                .addRelevance(),
        });

        registerSearchTarget('campaign', {
            overwriteSorting: builder => builder
                .clear()
                .addBrandAscending()
                .addPopularityDescending(),
        });

        await fixture<ProductSearch>(html`
            <relewise-product-search
                target="campaign"
                displayed-at-location="PLP">
            </relewise-product-search>
        `);

        await new Promise(resolve => setTimeout(resolve, 10));

        const expectedSorting = new ProductSortingBuilder();
        expectedSorting.sortByProductPopularity('Descending', thenBy => thenBy.sortByProductRelevance());

        assert.deepEqual((capturedRequest as any)?.sorting, expectedSorting.build());
    });
});
