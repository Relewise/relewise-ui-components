import { assert } from '@esm-bundle/chai';
import { Settings, UserFactory } from '@relewise/client';
import { buildProductCategorySearchRequest, clearUrlState, initializeRelewiseUI, QueryKeys, updateUrlState, updateUrlStateValues, useSearch } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

const settings: Settings = {
    currency: 'currency',
    displayedAtLocation: 'Search',
    language: 'language',
    user: UserFactory.anonymous(),
};

suite('productCategorySearchRequestBuilder', () => {
    setup(() => {
        clearUrlState();
        initializeRelewiseUI(mockRelewiseOptions());
    });

    teardown(() => {
        clearUrlState();
    });

    test('builds product category facets with labels and selected values from scoped URL state', () => {
        useSearch({
            facets: {
                productCategory(builder) {
                    builder
                        .addFacet(f => f.addProductCategoryDataStringValueFacet('Department'), { heading: 'Department' })
                        .addFacet(f => f.addProductCategoryDataDoubleRangeFacet('Priority'), { heading: 'Priority' });
                },
            },
        });

        updateUrlStateValues(QueryKeys.productCategoryFacet + 'DataDepartment', ['Electronics']);
        updateUrlState(QueryKeys.productCategoryFacetLowerbound + 'DataPriority', '1');
        updateUrlState(QueryKeys.productCategoryFacetUpperbound + 'DataPriority', '10');

        const result = buildProductCategorySearchRequest({
            term: 'phone',
            settings,
            page: 1,
            pageSize: 15,
        });

        assert.deepEqual(result.facetLabels, ['Department', 'Priority']);

        const facets = result.request.facets?.items as any[];
        const departmentFacet = facets.find(facet => facet.key === 'Department');
        const priorityFacet = facets.find(facet => facet.key === 'Priority');

        assert.deepEqual(departmentFacet.selected, ['Electronics']);
        assert.deepEqual(priorityFacet.selected, {
            lowerBoundInclusive: 1,
            upperBoundInclusive: 10,
        });
    });
});
