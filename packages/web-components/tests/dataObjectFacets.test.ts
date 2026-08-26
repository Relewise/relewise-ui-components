import { assert, fixture, html } from '@open-wc/testing';
import { FacetBuilder, ProductDataObjectFacet, ProductFacetResult } from '@relewise/client';
import { ChecklistStringValueFacet, Facets, ProductSearch, initializeRelewiseUI } from '../src';
import { QueryKeys, clearUrlState, updateUrlStateValues } from '../src/helpers';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('DataObject facets', () => {
    setup(() => {
        clearUrlState();
        initializeRelewiseUI(mockRelewiseOptions()).useSearch();
    });

    test('hydrates nested selections from the complete object path', () => {
        const facetBuilder = new FacetBuilder();
        facetBuilder.addProductDataObjectFacet('brand_values', 'Product', builder =>
            builder.addStringFacet('brand_name'));

        const facet = facetBuilder.build()!.items[0] as ProductDataObjectFacet;
        const nestedFacet = facet.items[0];
        const search = document.createElement('relewise-product-search') as ProductSearch;
        updateUrlStateValues(`${QueryKeys.facet}Databrand_values.brand_name`, ['Relewise']);

        search.getSelectedValuesForFacet(facet);

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
