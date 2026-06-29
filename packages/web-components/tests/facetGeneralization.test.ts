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
