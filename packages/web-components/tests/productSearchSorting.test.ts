import { assert, fixture, html } from '@open-wc/testing';
import { clearUrlState, ProductSearchSorting, QueryKeys, readCurrentUrlState, updateUrlState, useSearch } from '../src';

suite('product-search-sorting', () => {
    setup(() => {
        clearUrlState();
    });

    teardown(() => {
        clearUrlState();
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
});
