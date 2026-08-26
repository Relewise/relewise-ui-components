import { assert, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import { ContentFacetResult, ProductFacetResult } from '@relewise/client';
import { clearUrlState, Events, Facets, initializeRelewiseUI, QueryKeys, updateUrlState, useSearch } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('facet generalization', () => {
    setup(() => {
        clearUrlState();
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch();
    });

    teardown(() => {
        clearUrlState();
        fixtureCleanup();
        window.relewiseUIOptions = undefined!;
        window.relewiseUISearchOptions = undefined!;
    });

    test('keeps product facets on the existing product facet URL keys', async () => {
        const el = await fixture(html`
            <relewise-facets
                .facetResult=${productStringFacetResult()}
                .labels=${['Color']}>
            </relewise-facets>
        `) as Facets;

        el.showFacets = true;
        await el.updateComplete;

        const facet = el.shadowRoot!.querySelector('relewise-checklist-string-value-facet')!;
        await waitUntil(() => facet.shadowRoot?.querySelector('input'), 'facet input was not rendered');

        facet.shadowRoot!.querySelector('input')!.click();

        assert.deepEqual(new URL(window.location.href).searchParams.getAll(QueryKeys.facet + 'DataColor'), ['Red']);
    });

    test('renders content facets through the same checklist component with existing URL keys', async () => {
        let eventCount = 0;
        window.addEventListener(Events.applyFacet, () => eventCount++, { once: true });

        const el = await fixture(html`
            <relewise-facets
                .facetResult=${contentStringFacetResult()}
                .labels=${['Topic']}>
            </relewise-facets>
        `) as Facets;

        el.showFacets = true;
        await el.updateComplete;

        const facet = el.shadowRoot!.querySelector('relewise-checklist-string-value-facet')!;
        await waitUntil(() => facet.shadowRoot?.querySelector('input'), 'facet input was not rendered');

        facet.shadowRoot!.querySelector('input')!.click();

        const searchParams = new URL(window.location.href).searchParams;
        assert.deepEqual(searchParams.getAll(QueryKeys.facet + 'DataTopic'), ['Guide']);
        assert.equal(eventCount, 1);
    });

    test('can render content facets with scoped URL keys', async () => {
        const el = await fixture(html`
            <relewise-facets
                .facetQueryKeyPrefix=${QueryKeys.contentFacet}
                .facetResult=${contentStringFacetResult()}
                .labels=${['Topic']}>
            </relewise-facets>
        `) as Facets;

        el.showFacets = true;
        await el.updateComplete;

        const facet = el.shadowRoot!.querySelector('relewise-checklist-string-value-facet')!;
        await waitUntil(() => facet.shadowRoot?.querySelector('input'), 'facet input was not rendered');

        facet.shadowRoot!.querySelector('input')!.click();

        const searchParams = new URL(window.location.href).searchParams;
        assert.deepEqual(searchParams.getAll(QueryKeys.contentFacet + 'DataTopic'), ['Guide']);
        assert.deepEqual(searchParams.getAll(QueryKeys.facet + 'DataTopic'), []);
    });

    test('can render product facets with scoped URL keys', async () => {
        const el = await fixture(html`
            <relewise-facets
                .facetQueryKeyPrefix=${QueryKeys.productFacet}
                .facetResult=${productStringFacetResult()}
                .labels=${['Color']}>
            </relewise-facets>
        `) as Facets;

        el.showFacets = true;
        await el.updateComplete;

        const facet = el.shadowRoot!.querySelector('relewise-checklist-string-value-facet')!;
        await waitUntil(() => facet.shadowRoot?.querySelector('input'), 'facet input was not rendered');

        facet.shadowRoot!.querySelector('input')!.click();

        const searchParams = new URL(window.location.href).searchParams;
        assert.deepEqual(searchParams.getAll(QueryKeys.productFacet + 'DataColor'), ['Red']);
        assert.deepEqual(searchParams.getAll(QueryKeys.facet + 'DataColor'), []);
    });

    test('sorts facet values alphanumerically without moving selected values first', async () => {
        const el = await fixture(html`
            <relewise-facets
                .facetResult=${productColorFacetResult()}
                .labels=${['Color']}>
            </relewise-facets>
        `) as Facets;

        el.showFacets = true;
        await el.updateComplete;

        const facet = el.shadowRoot!.querySelector('relewise-checklist-string-value-facet')!;
        await waitUntil(() => facet.shadowRoot?.querySelectorAll('input').length === 3, 'facet inputs were not rendered');
        const colorTenInput = facet.shadowRoot!.querySelectorAll('input')[2];
        colorTenInput.click();

        el.facetResult = productColorFacetResult('Color 10');
        await el.updateComplete;
        await facet.updateComplete;

        const inputs = [...facet.shadowRoot!.querySelectorAll('input')];
        const values = inputs.map(input => input.closest('label')?.querySelector('[part="value"]')?.textContent);
        assert.deepEqual(values, ['Blue', 'Color 2', 'Color 10']);
        assert.equal(inputs[2], colorTenInput);
        assert.equal(inputs.filter(input => input.checked).length, 1);
        assert.isTrue(inputs[2].checked);
        assert.notInclude(inputs[0].closest('label')?.textContent ?? '', 'Color 10');
    });

    test('derives range URL keys from the facet prefix', async () => {
        const el = await fixture(html`
            <relewise-facets
                .facetQueryKeyPrefix=${QueryKeys.productFacet}
                .facetResult=${productRangeFacetResult()}
                .labels=${['Price']}>
            </relewise-facets>
        `) as Facets;

        el.showFacets = true;
        await el.updateComplete;

        const facet = el.shadowRoot!.querySelector<any>('relewise-number-range-facet')!;
        assert.equal(facet.upperboundQueryKeyPrefix, QueryKeys.productFacetUpperbound);
        assert.equal(facet.lowerboundQueryKeyPrefix, QueryKeys.productFacetLowerbound);
    });

    test('validates range bounds when they are applied without constraining typing', async () => {
        const el = await fixture(html`
            <relewise-facets
                .facetQueryKeyPrefix=${QueryKeys.productFacet}
                .facetResult=${productRangeFacetResult()}
                .labels=${['Price']}>
            </relewise-facets>
        `) as Facets;

        let applyCount = 0;
        el.applyFacet = () => {
            applyCount++;
            return true;
        };
        el.showFacets = true;
        await el.updateComplete;
        const facet = el.shadowRoot!.querySelector<any>('relewise-number-range-facet')!;
        await facet.updateComplete;
        const inputs = [...facet.shadowRoot!.querySelectorAll('input')] as HTMLInputElement[];

        assert.equal(inputs[0].min, '');
        assert.equal(inputs[0].max, '');
        assert.equal(inputs[1].min, '');
        assert.equal(inputs[1].max, '');

        inputs[0].value = '';
        inputs[0].dispatchEvent(new Event('input'));
        assert.equal(inputs[0].value, '');

        inputs[0].value = '5';
        inputs[0].dispatchEvent(new Event('input'));
        inputs[1].value = '150';
        inputs[1].dispatchEvent(new Event('input'));
        facet.save();
        assert.equal(inputs[0].value, '10');
        assert.equal(inputs[1].value, '100');
        assert.equal(applyCount, 0);

        inputs[0].value = '20';
        inputs[0].dispatchEvent(new Event('input'));
        inputs[1].value = '90';
        inputs[1].dispatchEvent(new Event('input'));
        facet.save();
        assert.equal(new URL(window.location.href).searchParams.get(`${QueryKeys.productFacetLowerbound}SalesPrice`), '20');
        assert.equal(new URL(window.location.href).searchParams.get(`${QueryKeys.productFacetUpperbound}SalesPrice`), '90');
        assert.equal(applyCount, 1);

        el.facetResult = productRangeFacetResult(20, 90);
        await el.updateComplete;
        await facet.updateComplete;
        inputs[0].value = '10';
        inputs[0].dispatchEvent(new Event('input'));
        inputs[1].value = '100';
        inputs[1].dispatchEvent(new Event('input'));
        facet.save();

        assert.isNull(new URL(window.location.href).searchParams.get(`${QueryKeys.productFacetLowerbound}SalesPrice`));
        assert.isNull(new URL(window.location.href).searchParams.get(`${QueryKeys.productFacetUpperbound}SalesPrice`));
        assert.equal(applyCount, 2);

        el.facetResult = productRangeFacetResult(30, 80);
        await el.updateComplete;
        await facet.updateComplete;
        inputs[0].value = '20';
        inputs[0].dispatchEvent(new Event('input'));
        inputs[1].value = '90';
        inputs[1].dispatchEvent(new Event('input'));
        facet.save();

        assert.equal(inputs[0].value, '30');
        assert.equal(inputs[1].value, '80');
        assert.equal(applyCount, 2);
    });

    test('renders shared URL range bounds even when they exceed the available result bounds', async () => {
        updateUrlState(`${QueryKeys.productFacetLowerbound}SalesPrice`, '250');
        updateUrlState(`${QueryKeys.productFacetUpperbound}SalesPrice`, '500');
        const el = await fixture(html`
            <relewise-facets
                .facetQueryKeyPrefix=${QueryKeys.productFacet}
                .facetResult=${productRangeFacetResult()}
                .labels=${['Price']}>
            </relewise-facets>
        `) as Facets;

        el.showFacets = true;
        await el.updateComplete;
        const facet = el.shadowRoot!.querySelector<any>('relewise-number-range-facet')!;
        await facet.updateComplete;
        const inputs = [...facet.shadowRoot!.querySelectorAll('input')] as HTMLInputElement[];

        assert.equal(inputs[0].value, '250');
        assert.equal(inputs[1].value, '500');
        assert.equal(inputs[0].min, '');
        assert.equal(inputs[0].max, '');
        assert.equal(inputs[1].min, '');
        assert.equal(inputs[1].max, '');
    });

    test('applies object-valued facets with scoped URL keys', async () => {
        let applyCount = 0;
        const el = await fixture(html`
            <relewise-facets
                .facetQueryKeyPrefix=${QueryKeys.productFacet}
                .facetResult=${productBrandFacetResult()}
                .labels=${['Brand']}
                .applyFacet=${() => applyCount++}>
            </relewise-facets>
        `) as Facets;

        el.showFacets = true;
        await el.updateComplete;

        const facet = el.shadowRoot!.querySelector('relewise-checklist-object-value-facet')!;
        await waitUntil(() => facet.shadowRoot?.querySelector('input'), 'facet input was not rendered');

        const input = facet.shadowRoot!.querySelector('input')!;
        input.click();

        assert.deepEqual(new URL(window.location.href).searchParams.getAll(QueryKeys.productFacet + 'Brand'), ['brand-1']);
        assert.equal(applyCount, 1);
        assert.isTrue(input.checked);

        input.click();

        assert.deepEqual(new URL(window.location.href).searchParams.getAll(QueryKeys.productFacet + 'Brand'), []);
        assert.equal(applyCount, 2);
        assert.isFalse(input.checked);
    });

    test('does not render empty facet groups', async () => {
        const el = await fixture(html`
            <relewise-facets
                .facetResult=${contentFacetResultWithEmptyGroup()}
                .labels=${['Empty', 'Topic']}>
            </relewise-facets>
        `) as Facets;

        el.showFacets = true;
        await el.updateComplete;

        const renderedFacets = el.shadowRoot!.querySelectorAll('relewise-checklist-string-value-facet');

        assert.equal(renderedFacets.length, 1);
        assert.include(renderedFacets[0].shadowRoot!.textContent!, 'Guide');
        assert.notInclude(renderedFacets[0].shadowRoot!.textContent!, 'Empty');
    });

    test('does not render controls for an unselected single-option facet', async () => {
        const el = await fixture(html`
            <relewise-facets
                .facetResult=${productSingleOptionFacetResult(false)}
                .totalHits=${12}
                .labels=${['Category']}>
            </relewise-facets>
        `) as Facets;

        el.showFacets = true;
        await el.updateComplete;

        assert.isNull(el.renderRoot.querySelector('.rw-facet-button'));
        assert.isNull(el.renderRoot.querySelector('.rw-facets-container'));
        assert.isNull(el.renderRoot.querySelector('relewise-checklist-string-value-facet'));
    });

    test('renders an unselected single option when it excludes some search results', async () => {
        const el = await fixture(html`
            <relewise-facets
                .facetResult=${productSingleOptionFacetResult(false)}
                .totalHits=${20}
                .labels=${['Category']}>
            </relewise-facets>
        `) as Facets;

        el.showFacets = true;
        await el.updateComplete;

        assert.isNotNull(el.renderRoot.querySelector('.rw-facets-container'));
        assert.isNotNull(el.renderRoot.querySelector('relewise-checklist-string-value-facet'));
    });

    test('keeps a selected single-option facet visible so it can be removed', async () => {
        updateUrlState(`${QueryKeys.productFacet}DataCategory`, 'Shoes');
        const el = await fixture(html`
            <relewise-facets
                .facetQueryKeyPrefix=${QueryKeys.productFacet}
                .facetResult=${productSingleOptionFacetResult(true)}
                .labels=${['Category']}>
            </relewise-facets>
        `) as Facets;

        el.showFacets = true;
        await el.updateComplete;

        const facet = el.renderRoot.querySelector('relewise-checklist-string-value-facet')!;
        await waitUntil(() => facet.renderRoot.querySelector('input'), 'selected facet input was not rendered');

        assert.isNotNull(el.renderRoot.querySelector('.rw-facets-container'));
        assert.isTrue(facet.renderRoot.querySelector('input')!.checked);
    });

    test('keeps the existing toggle by default and supports an always-expanded presentation', async () => {
        const defaultFacets = await fixture<Facets>(html`
            <relewise-facets
                .facetResult=${productStringFacetResult()}
                .labels=${['Color']}>
            </relewise-facets>
        `);
        assert.isNotNull(defaultFacets.renderRoot.querySelector('.rw-facet-button'));

        const expandedFacets = await fixture<Facets>(html`
            <relewise-facets
                expanded
                .facetResult=${productStringFacetResult()}
                .labels=${['Color']}>
            </relewise-facets>
        `);

        assert.isNull(expandedFacets.renderRoot.querySelector('.rw-facet-button'));
        assert.isNotNull(expandedFacets.renderRoot.querySelector('.rw-facets-container'));
    });
});

function productStringFacetResult(): ProductFacetResult {
    return {
        items: [{
            $type: 'Relewise.Client.DataTypes.Search.Facets.Result.ProductDataStringValueFacetResult, Relewise.Client',
            field: 'Data',
            key: 'Color',
            available: ['Red', 'Yellow'].map(value => ({
                value,
                hits: 12,
                selected: false,
            })),
        }],
    } as ProductFacetResult;
}

function productSingleOptionFacetResult(selected: boolean): ProductFacetResult {
    return {
        items: [{
            $type: 'Relewise.Client.DataTypes.Search.Facets.Result.ProductDataStringValueFacetResult, Relewise.Client',
            field: 'Data',
            key: 'Category',
            available: [{
                value: 'Shoes',
                hits: 12,
                selected,
            }],
        }],
    } as ProductFacetResult;
}

function productColorFacetResult(selectedValue?: string): ProductFacetResult {
    return {
        items: [{
            $type: 'Relewise.Client.DataTypes.Search.Facets.Result.ProductDataStringValueFacetResult, Relewise.Client',
            field: 'Data',
            key: 'Color',
            available: ['Color 10', 'Blue', 'Color 2'].map(value => ({
                value,
                hits: 12,
                selected: value === selectedValue,
            })),
        }],
    } as ProductFacetResult;
}

function contentStringFacetResult(): ContentFacetResult {
    return {
        items: [{
            $type: 'Relewise.Client.DataTypes.Search.Facets.Result.ContentDataStringValueFacetResult, Relewise.Client',
            field: 'Data',
            key: 'Topic',
            available: ['Guide', 'Manual'].map(value => ({
                value,
                hits: 4,
                selected: false,
            })),
        }],
    } as ContentFacetResult;
}

function productRangeFacetResult(lowerBoundInclusive = 10, upperBoundInclusive = 100): ProductFacetResult {
    return {
        items: [{
            $type: 'Relewise.Client.DataTypes.Search.Facets.Result.PriceRangeFacetResult, Relewise.Client',
            field: 'SalesPrice',
            available: {
                value: {
                    lowerBoundInclusive,
                    upperBoundInclusive,
                },
            },
        }],
    } as ProductFacetResult;
}

function productBrandFacetResult(): ProductFacetResult {
    return {
        items: [{
            $type: 'Relewise.Client.DataTypes.Search.Facets.Result.BrandFacetResult, Relewise.Client',
            field: 'Brand',
            available: ['brand-1', 'brand-2'].map((id, index) => ({
                value: {
                    id,
                    displayName: `Brand ${index + 1}`,
                },
                hits: 3,
                selected: false,
            })),
        }],
    } as ProductFacetResult;
}

function contentFacetResultWithEmptyGroup(): ContentFacetResult {
    return {
        items: [
            {
                $type: 'Relewise.Client.DataTypes.Search.Facets.Result.ContentDataStringValueFacetResult, Relewise.Client',
                field: 'Data',
                key: 'Empty',
                available: [],
            },
            {
                $type: 'Relewise.Client.DataTypes.Search.Facets.Result.ContentDataStringValueFacetResult, Relewise.Client',
                field: 'Data',
                key: 'Topic',
                available: ['Guide', 'Manual'].map(value => ({
                    value,
                    hits: 4,
                    selected: false,
                })),
            },
        ],
    } as ContentFacetResult;
}
