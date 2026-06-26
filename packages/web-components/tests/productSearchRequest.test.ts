import { assert } from '@esm-bundle/chai';
import { ProductSortingBuilder, Settings, UserFactory } from '@relewise/client';
import { buildProductSearchRequest, clearUrlState, initializeRelewiseUI, QueryKeys, registerSearchTarget, SortingEnum, updateUrlState, updateUrlStateValues, useSearch } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

const settings: Settings = {
    currency: 'currency',
    displayedAtLocation: 'Search',
    language: 'language',
    user: UserFactory.anonymous(),
};

suite('productSearchRequest', () => {
    setup(() => {
        clearUrlState();
        initializeRelewiseUI(mockRelewiseOptions());
    });

    teardown(() => {
        clearUrlState();
    });

    test('builds product facets with labels and selected values from URL state', () => {
        useSearch({
            facets: {
                product(builder) {
                    builder
                        .addFacet(f => f.addBrandFacet(), { heading: 'Brand' })
                        .addFacet(f => f.addSalesPriceRangeFacet('Product'), { heading: 'Price' });
                },
            },
        });

        updateUrlStateValues(QueryKeys.facet + 'Brand', ['brand-1']);
        updateUrlState(QueryKeys.facetLowerbound + 'SalesPrice', '10');
        updateUrlState(QueryKeys.facetUpperbound + 'SalesPrice', '100');

        const result = buildProductSearchRequest({
            term: 'shoe',
            settings,
            page: 1,
            pageSize: 16,
            productsLoaded: 0,
            productsToFetch: null,
            target: null,
        });

        assert.deepEqual(result.facetLabels, ['Brand', 'Price']);

        const facets = result.request.facets?.items as any[];
        const brandFacet = facets.find(facet => facet.field === 'Brand');
        const priceFacet = facets.find(facet => facet.field === 'SalesPrice');

        assert.deepEqual(brandFacet.selected, ['brand-1']);
        assert.deepEqual(priceFacet.selected, {
            lowerBoundInclusive: 10,
            upperBoundInclusive: 100,
        });
    });

    test('uses targeted facets and sorting when target is provided', () => {
        useSearch({
            sorting: builder => builder
                .clear()
                .addRelevance(),
        });

        registerSearchTarget('campaign', {
            overwriteFacets: builder => builder
                .addFacet(f => f.addCategoryFacet('ImmediateParent'), { heading: 'Campaign categories' }),
            overwriteSorting: builder => builder
                .clear()
                .addPopularityDescending(),
        });

        updateUrlState(QueryKeys.sortBy, SortingEnum.PopularityDesc);

        const result = buildProductSearchRequest({
            term: 'shoe',
            settings,
            page: 1,
            pageSize: 16,
            productsLoaded: 0,
            productsToFetch: null,
            target: 'campaign',
        });

        const expectedSorting = new ProductSortingBuilder();
        expectedSorting.sortByProductPopularity('Descending', thenBy => thenBy.sortByProductRelevance());

        assert.deepEqual(result.facetLabels, ['Campaign categories']);
        assert.deepEqual(result.request.sorting, expectedSorting.build());
        assert.equal(result.request.facets?.items[0].field, 'Category');
    });

    test('uses requested product count for initial load when rw-take is present', () => {
        useSearch();

        const result = buildProductSearchRequest({
            term: 'shoe',
            settings,
            page: 3,
            pageSize: 16,
            productsLoaded: 0,
            productsToFetch: 48,
            target: null,
        });

        assert.equal((result.request as any).take, 48);
        assert.equal((result.request as any).skip, 0);
    });
});
