import { assert, fixture, html } from '@open-wc/testing';
import { ContentDataObjectFacet, ProductCategoryDataObjectFacet, ProductDataObjectFacet, ProductFacetResult, Settings, UserFactory } from '@relewise/client';
import { buildContentSearchRequest, buildProductCategorySearchRequest, buildProductSearchRequest, ChecklistNumberValueFacet, ChecklistRangesObjectValueFacet, ChecklistStringValueFacet, Facets, initializeRelewiseUI, useSearch } from '../src';
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

    test('hydrates nested selections for Universal Search entity builders', () => {
        useSearch({
            facets: {
                content(builder) {
                    builder.addFacet(facetBuilder => facetBuilder.addContentDataObjectFacet('metadata', nestedBuilder =>
                        nestedBuilder.addStringFacet('topic')), { heading: 'Content metadata' });
                },
                productCategory(builder) {
                    builder.addFacet(facetBuilder => facetBuilder.addProductCategoryDataObjectFacet('metadata', nestedBuilder =>
                        nestedBuilder.addStringFacet('topic')), { heading: 'Category metadata' });
                },
            },
        });

        updateUrlStateValues(`${QueryKeys.contentFacet}Datametadata.topic`, ['guide']);
        updateUrlStateValues(`${QueryKeys.productCategoryFacet}Datametadata.topic`, ['footwear']);

        const contentResult = buildContentSearchRequest({ term: 'shoe', settings, page: 1, pageSize: 16 });
        const productCategoryResult = buildProductCategorySearchRequest({ term: 'shoe', settings, page: 1, pageSize: 16 });
        const contentFacet = contentResult.request.facets?.items[0] as ContentDataObjectFacet;
        const productCategoryFacet = productCategoryResult.request.facets?.items[0] as ProductCategoryDataObjectFacet;

        assert.deepEqual('selected' in contentFacet.items[0] ? contentFacet.items[0].selected : null, ['guide']);
        assert.deepEqual('selected' in productCategoryFacet.items[0] ? productCategoryFacet.items[0].selected : null, ['footwear']);
    });

    test('renders and selects zero-valued nested number facets', async() => {
        const facetResult = {
            items: [{
                $type: 'Relewise.Client.DataTypes.Search.Facets.Result.ProductDataObjectFacetResult, Relewise.Client',
                field: 'Data',
                key: 'metrics',
                evaluationMode: 'And',
                dataSelectionStrategy: 'Product',
                items: [{
                    $type: 'Relewise.Client.DataTypes.Search.Facets.Result.DataObjectDoubleValueFacetResult, Relewise.Client',
                    field: 'Data',
                    key: 'score',
                    available: [{ value: 0, hits: 1, selected: false }],
                }],
            }],
        } as ProductFacetResult;
        const facets = await fixture<Facets>(html`
            <relewise-facets .facetResult=${facetResult} .totalHits=${2} .labels=${['Score']}></relewise-facets>
        `);
        facets.showFacets = true;
        await facets.updateComplete;

        const numberFacet = facets.renderRoot.querySelector('relewise-checklist-number-value-facet') as ChecklistNumberValueFacet;
        await numberFacet.updateComplete;
        const input = numberFacet.renderRoot.querySelector('input')!;
        const value = numberFacet.renderRoot.querySelector('[part="value"]')!;
        assert.equal(value.textContent, '0');

        input.click();

        assert.deepEqual(new URL(window.location.href).searchParams.getAll(`${QueryKeys.facet}Datametrics.score`), ['0']);
    });

    test('round-trips negative and open-ended nested ranges', async() => {
        useSearch({
            facets: {
                product(builder) {
                    builder.addFacet(facetBuilder => facetBuilder.addProductDataObjectFacet('metrics', 'Product', nestedBuilder =>
                        nestedBuilder.addNumberRangesFacet('score')), { heading: 'Score' });
                },
            },
        });
        const facetResult = {
            items: [{
                $type: 'Relewise.Client.DataTypes.Search.Facets.Result.ProductDataObjectFacetResult, Relewise.Client',
                field: 'Data',
                key: 'metrics',
                evaluationMode: 'And',
                dataSelectionStrategy: 'Product',
                items: [{
                    $type: 'Relewise.Client.DataTypes.Search.Facets.Result.DataObjectDoubleRangesFacetResult, Relewise.Client',
                    field: 'Data',
                    key: 'score',
                    available: [
                        { value: { lowerBoundInclusive: -10, upperBoundExclusive: 0 }, hits: 1, selected: false },
                        { value: { lowerBoundInclusive: null, upperBoundExclusive: 10 }, hits: 1, selected: false },
                        { value: { lowerBoundInclusive: 5, upperBoundExclusive: null }, hits: 1, selected: false },
                    ],
                }],
            }],
        } as ProductFacetResult;
        const facets = await fixture<Facets>(html`
            <relewise-facets .facetResult=${facetResult} .totalHits=${4} .labels=${['Score']}></relewise-facets>
        `);
        facets.showFacets = true;
        await facets.updateComplete;

        const rangesFacet = facets.renderRoot.querySelector('relewise-checklist-ranges-object-value-facet') as ChecklistRangesObjectValueFacet;
        await rangesFacet.updateComplete;
        const labels = [...rangesFacet.renderRoot.querySelectorAll<HTMLElement>('[part="value"]')];
        assert.deepEqual(labels.map(label => label.textContent), ['-10 - 0', '< 10', '≥ 5']);

        const negativeRangeInput = [...rangesFacet.renderRoot.querySelectorAll<HTMLInputElement>('input')]
            .find(input => input.closest('label')?.textContent?.includes('-10 - 0'))!;
        negativeRangeInput.click();

        const queryKey = `${QueryKeys.facet}Datametrics.score`;
        assert.deepEqual(new URL(window.location.href).searchParams.getAll(queryKey), ['[-10,0]']);
        const request = buildProductSearchRequest({
            term: 'shoe',
            settings,
            page: 1,
            pageSize: 16,
            productsLoaded: 0,
            productsToFetch: null,
            target: null,
        });
        const objectFacet = request.request.facets?.items[0] as ProductDataObjectFacet;
        assert.deepEqual('selected' in objectFacet.items[0] ? objectFacet.items[0].selected : null, [{
            lowerBoundInclusive: -10,
            upperBoundExclusive: 0,
        }]);
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

    test('labels multiple visible children and removes trailing styling from the last visible child', async() => {
        const stringResult = (key: string, value: string, hits: number) => ({
            $type: 'Relewise.Client.DataTypes.Search.Facets.Result.DataObjectStringValueFacetResult, Relewise.Client',
            field: 'Data',
            key,
            available: [{ value, hits, selected: false }],
        });
        const facetResult = {
            items: [{
                $type: 'Relewise.Client.DataTypes.Search.Facets.Result.ProductDataObjectFacetResult, Relewise.Client',
                field: 'Data',
                key: 'details',
                evaluationMode: 'And',
                dataSelectionStrategy: 'Product',
                items: [
                    stringResult('color', 'Red', 2),
                    stringResult('size', 'Large', 2),
                    stringResult('hidden', 'Only value', 3),
                ],
            }],
        } as ProductFacetResult;
        const facets = await fixture<Facets>(html`
            <relewise-facets .facetResult=${facetResult} .totalHits=${3} .labels=${['Details']}></relewise-facets>
        `);
        facets.showFacets = true;
        await facets.updateComplete;

        const nestedFacets = [...facets.renderRoot.querySelectorAll('relewise-checklist-string-value-facet')] as ChecklistStringValueFacet[];
        assert.deepEqual(nestedFacets.map(facet => facet.label), ['Details: color', 'Details: size']);
        assert.equal(nestedFacets[0].style.borderBottom, '');
        assert.equal(nestedFacets[1].style.borderBottom, '0px');
        assert.equal(nestedFacets[1].style.paddingBottom, '0px');
    });
});
