import { assert, fixture, html } from '@open-wc/testing';
import { ProductDataObjectFacet, ProductFacetResult, Settings, UserFactory } from '@relewise/client';
import { buildProductSearchRequest, ChecklistStringValueFacet, Facets, initializeRelewiseUI, useSearch } from '../src';
import { QueryKeys, clearUrlState, updateUrlStateValues } from '../src/helpers';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

const settings: Settings = {
    currency: 'currency',
    displayedAtLocation: 'Search',
    language: 'language',
    user: UserFactory.anonymous(),
};

suite('DataObject facets', () => {
    setup(() => {
        clearUrlState();
        initializeRelewiseUI(mockRelewiseOptions());
    });

    test('hydrates nested selections from the complete object path', () => {
        useSearch({
            facets: {
                product(builder) {
                    builder.addFacet(facetBuilder => facetBuilder.addProductDataObjectFacet('brand_values', 'Product', nestedBuilder =>
                        nestedBuilder.addStringFacet('brand_name')), { heading: 'Brand' });
                },
            },
        });

        updateUrlStateValues(`${QueryKeys.facet}Databrand_values.brand_name`, ['Relewise']);

        const result = buildProductSearchRequest({
            term: 'shoe',
            settings,
            page: 1,
            pageSize: 16,
            productsLoaded: 0,
            productsToFetch: null,
            target: null,
        });
        const facet = result.request.facets?.items[0] as ProductDataObjectFacet;
        const nestedFacet = facet.items[0];

        assert.deepEqual('selected' in nestedFacet ? nestedFacet.selected : null, ['Relewise']);
        assert.deepEqual(nestedFacet.settings, {
            alwaysIncludeSelectedInAvailable: true,
            includeZeroHitsInAvailable: false,
        });
        assert.equal('key' in nestedFacet ? nestedFacet.key : null, 'brand_name');
    });

    test('renders a nested scalar result using its complete object path', async() => {
        const nestedResult = {
            $type: 'Relewise.Client.DataTypes.Search.Facets.Result.DataObjectStringValueFacetResult, Relewise.Client',
            field: 'Data',
            key: 'brand_name',
            available: [{ value: 'Relewise', hits: 1, selected: false }],
        };
        const facetResult = {
            items: [{
                $type: 'Relewise.Client.DataTypes.Search.Facets.Result.ProductDataObjectFacetResult, Relewise.Client',
                field: 'Data',
                key: 'brand_values',
                evaluationMode: 'And',
                dataSelectionStrategy: 'Product',
                items: [nestedResult],
            }],
        } as ProductFacetResult;

        const facets = await fixture<Facets>(html`
            <relewise-facets
                .facetResult=${facetResult}
                .totalHits=${2}
                .labels=${['Brand']}>
            </relewise-facets>
        `);
        facets.showFacets = true;
        await facets.updateComplete;

        const nestedFacet = facets.renderRoot.querySelector('relewise-checklist-string-value-facet') as ChecklistStringValueFacet;
        assert.exists(nestedFacet);
        assert.equal(nestedFacet.label, 'Brand');
        assert.equal(nestedFacet.urlKey, 'brand_values.brand_name');
        assert.equal(nestedFacet.result?.key, 'brand_name');
    });
});
