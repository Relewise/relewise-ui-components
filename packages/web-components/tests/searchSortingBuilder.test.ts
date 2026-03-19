import { assert } from '@esm-bundle/chai';
import { ProductSortingBuilder } from '@relewise/client';
import { getSearchSortingOptions, getSearchSortingSelection, SearchSortingOptionsBuilder, SortingEnum } from '../src';

function buildSortingValue(selectedOptionId: string | null | undefined, configure?: (builder: SearchSortingOptionsBuilder) => void) {
    const selectedOption = getSearchSortingSelection(selectedOptionId, configure);
    const builder = new ProductSortingBuilder();

    selectedOption?.apply(builder);

    return builder.build();
}

suite('searchSortingBuilder', () => {
    test('includes the seeded default sorting options in order', () => {
        const result = getSearchSortingOptions();

        assert.deepEqual(
            result.map(option => option.id),
            [
                SortingEnum.Relevance,
                SortingEnum.SalesPriceAsc,
                SortingEnum.SalesPriceDesc,
                SortingEnum.AlphabeticallyAsc,
                SortingEnum.AlphabeticallyDesc,
            ],
        );
    });

    test('clear removes the seeded default sorting options', () => {
        const result = getSearchSortingOptions(builder => builder.clear());

        assert.deepEqual(result, []);
    });

    test('addProductData maps to ProductSortingBuilder.sortByProductData', () => {
        const expected = new ProductSortingBuilder();
        expected.sortByProductData(
            'Rating',
            'Product',
            'Descending',
            thenBy => thenBy.sortByProductRelevance(),
            'Numerical',
        );

        const result = buildSortingValue('ProductData:Rating:Product:Descending:Numerical', builder => builder
            .clear()
            .addProductData({
                label: 'Rating',
                key: 'Rating',
                selectionStrategy: 'Product',
                order: 'Descending',
                mode: 'Numerical',
            }));

        assert.deepEqual(result, expected.build());
    });

    test('addProductData derives different ids for ascending and descending on the same key', () => {
        const result = getSearchSortingOptions(builder => builder
            .clear()
            .addProductData({
                label: 'Rating asc',
                key: 'Rating',
                selectionStrategy: 'Product',
                order: 'Ascending',
            })
            .addProductData({
                label: 'Rating desc',
                key: 'Rating',
                selectionStrategy: 'Product',
                order: 'Descending',
            }));

        assert.deepEqual(
            result.map(option => option.id),
            [
                'ProductData:Rating:Product:Ascending:Auto',
                'ProductData:Rating:Product:Descending:Auto',
            ],
        );
    });

    test('addBrandAscending maps to ProductSortingBuilder.sortByProductAttribute', () => {
        const expected = new ProductSortingBuilder();
        expected.sortByProductAttribute('BrandName', 'Ascending', thenBy => thenBy.sortByProductRelevance());

        const result = buildSortingValue(SortingEnum.BrandAsc, builder => builder
            .clear()
            .addBrandAscending());

        assert.deepEqual(result, expected.build());
    });

    test('addPopularityDescending maps to ProductSortingBuilder.sortByProductPopularity', () => {
        const expected = new ProductSortingBuilder();
        expected.sortByProductPopularity('Descending', thenBy => thenBy.sortByProductRelevance());

        const result = buildSortingValue(SortingEnum.PopularityDesc, builder => builder
            .clear()
            .addPopularityDescending());

        assert.deepEqual(result, expected.build());
    });

    test('unknown selection falls back to relevance when configured', () => {
        const expected = new ProductSortingBuilder();
        expected.sortByProductRelevance('Descending', thenBy => thenBy.sortByProductRelevance());

        const result = buildSortingValue('unknown');

        assert.deepEqual(result, expected.build());
    });

    test('unknown selection falls back to the first configured option when relevance is removed', () => {
        const selected = getSearchSortingSelection('unknown', builder => builder
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
            }));

        assert.equal(selected!.id, 'ProductData:Rating:Product:Descending:Auto');
    });

    test('duplicate sorting ids are logged and ignored', () => {
        const originalConsoleError = console.error;
        const consoleErrors: string[] = [];

        console.error = (message?: unknown) => {
            consoleErrors.push(String(message));
        };

        try {
            const result = getSearchSortingOptions(builder => builder
                .clear()
                .addRelevance()
                .addProductData({
                    id: SortingEnum.Relevance,
                    label: 'Rating',
                    key: 'Rating',
                    selectionStrategy: 'Product',
                    order: 'Descending',
                }));

            assert.deepEqual(result.map(option => option.id), [SortingEnum.Relevance]);
            assert.include(consoleErrors[0], `Duplicate search sorting option id '${SortingEnum.Relevance}'`);
        } finally {
            console.error = originalConsoleError;
        }
    });
});
