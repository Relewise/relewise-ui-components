import { assert, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import { ContentFacetResult, ProductFacetResult } from '@relewise/client';
import { clearUrlState, Events, Facets, initializeRelewiseUI, QueryKeys, useSearch } from '../src';
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
            available: [{
                value: 'Red',
                hits: 12,
                selected: false,
            }],
        }],
    } as ProductFacetResult;
}

function contentStringFacetResult(): ContentFacetResult {
    return {
        items: [{
            $type: 'Relewise.Client.DataTypes.Search.Facets.Result.ContentDataStringValueFacetResult, Relewise.Client',
            field: 'Data',
            key: 'Topic',
            available: [{
                value: 'Guide',
                hits: 4,
                selected: false,
            }],
        }],
    } as ContentFacetResult;
}

function productRangeFacetResult(): ProductFacetResult {
    return {
        items: [{
            $type: 'Relewise.Client.DataTypes.Search.Facets.Result.PriceRangeFacetResult, Relewise.Client',
            field: 'SalesPrice',
            available: {
                value: {
                    lowerBoundInclusive: 10,
                    upperBoundInclusive: 100,
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
            available: [{
                value: {
                    id: 'brand-1',
                    displayName: 'Brand 1',
                },
                hits: 3,
                selected: false,
            }],
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
                available: [{
                    value: 'Guide',
                    hits: 4,
                    selected: false,
                }],
            },
        ],
    } as ContentFacetResult;
}
