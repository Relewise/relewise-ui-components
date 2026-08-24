import { assert, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import type { ProductFacetResult } from '@relewise/client';
import { initializeRelewiseUI, useSearch } from '../src';
import type { Facets } from '../src/search/components/facets';
import type { UniversalSearchFacets } from '../src/search/universal-search-facets';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

function facetResult(): ProductFacetResult {
    return {
        items: [{
            $type: 'Relewise.Client.DataTypes.Search.Facets.Result.ProductDataStringValueFacetResult, Relewise.Client',
            field: 'Data',
            key: 'Color',
            available: [{
                value: 'A deliberately long facet value that must wrap without overlapping its hit count',
                hits: 12,
                selected: false,
            }],
        }],
    } as ProductFacetResult;
}

suite('universal search facets', () => {
    setup(() => {
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({ universalSearch: {} });
    });

    teardown(() => {
        fixtureCleanup();
        window.relewiseUISearchOptions = undefined!;
        window.relewiseUIOptions = undefined!;
    });

    test('is registered only with Universal Search', () => {
        assert.isDefined(customElements.get('relewise-universal-search-facets'));
    });

    test('opens and closes the drawer and restores focus to its trigger', async () => {
        const drawerStates: boolean[] = [];
        const element = await fixture<UniversalSearchFacets>(html`
            <relewise-universal-search-facets
                @universal-search-facets-drawer-state-changed=${(event: CustomEvent<{ open: boolean }>) => drawerStates.push(event.detail.open)}>
            </relewise-universal-search-facets>
        `);
        const trigger = element.renderRoot.querySelector<HTMLButtonElement>('.rw-trigger')!;

        assert.equal(trigger.getAttribute('aria-expanded'), 'false');
        trigger.click();
        await element.updateComplete;

        const drawer = element.renderRoot.querySelector<HTMLElement>('.rw-drawer')!;
        assert.equal(trigger.getAttribute('aria-expanded'), 'true');
        assert.isTrue(drawer.hasAttribute('open'));
        assert.equal(drawer.getAttribute('role'), 'dialog');
        assert.equal(drawer.getAttribute('aria-modal'), 'true');
        assert.equal(element.shadowRoot!.activeElement, element.renderRoot.querySelector('.rw-close'));

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await element.updateComplete;

        assert.equal(trigger.getAttribute('aria-expanded'), 'false');
        assert.equal(element.shadowRoot!.activeElement, trigger);
        assert.deepEqual(drawerStates, [true, false]);
    });

    test('forwards facet changes without closing the drawer', async () => {
        let eventCount = 0;
        const element = await fixture<UniversalSearchFacets>(html`
            <relewise-universal-search-facets
                .facetResult=${facetResult()}
                .labels=${['Color']}
                @universal-search-facets-changed=${() => eventCount++}>
            </relewise-universal-search-facets>
        `);
        const facets = element.renderRoot.querySelector<Facets>('relewise-facets')!;
        element.renderRoot.querySelector<HTMLButtonElement>('.rw-trigger')!.click();
        await element.updateComplete;

        facets.applyFacet();
        await element.updateComplete;

        assert.equal(eventCount, 1);
        assert.isTrue(element.renderRoot.querySelector('.rw-drawer')!.hasAttribute('open'));
        assert.isTrue(facets.expanded);
        assert.include(facets.getAttribute('exportparts') ?? '', 'container: facet-container');
    });

    test('uses unique accessible drawer ids', async () => {
        const wrapper = await fixture<HTMLElement>(html`
            <div>
                <relewise-universal-search-facets></relewise-universal-search-facets>
                <relewise-universal-search-facets></relewise-universal-search-facets>
            </div>
        `);
        const components = [...wrapper.querySelectorAll<UniversalSearchFacets>('relewise-universal-search-facets')];
        const drawerIds = components.map(component => component.renderRoot.querySelector('.rw-drawer')!.id);
        const controlledIds = components.map(component => component.renderRoot.querySelector('.rw-trigger')!.getAttribute('aria-controls'));

        assert.notEqual(drawerIds[0], drawerIds[1]);
        assert.deepEqual(controlledIds, drawerIds);
    });

    test('uses the trigger text color for the filter icon', async () => {
        const element = await fixture<UniversalSearchFacets>(html`
            <relewise-universal-search-facets></relewise-universal-search-facets>
        `);
        const trigger = element.renderRoot.querySelector<HTMLButtonElement>('.rw-trigger')!;
        const icon = element.renderRoot.querySelector<any>('relewise-filter-icon')!;
        await icon.updateComplete;

        const path = icon.renderRoot.querySelector<SVGPathElement>('path')!;
        assert.equal(getComputedStyle(path).fill, getComputedStyle(trigger).color);
    });

    test('uses a full-width compact drawer with centered facet content', async () => {
        const wrapper = await fixture<HTMLElement>(html`
            <div style="container: universal-search-dialog / inline-size; height: 30rem; position: relative; width: 30rem;">
                <relewise-universal-search-facets
                    style="--relewise-universal-search-mobile-facet-content-width: 20rem;"
                    .facetResult=${facetResult()}
                    .labels=${['Color']}>
                </relewise-universal-search-facets>
            </div>
        `);
        const element = wrapper.querySelector<UniversalSearchFacets>('relewise-universal-search-facets')!;
        element.renderRoot.querySelector<HTMLButtonElement>('.rw-trigger')!.click();
        await element.updateComplete;

        const drawer = element.renderRoot.querySelector<HTMLElement>('.rw-drawer')!;
        const facets = element.renderRoot.querySelector<HTMLElement>('relewise-facets')!;
        const wrapperBounds = wrapper.getBoundingClientRect();
        const drawerBounds = drawer.getBoundingClientRect();
        const facetBounds = facets.getBoundingClientRect();

        assert.closeTo(drawerBounds.width, wrapperBounds.width, 1);
        assert.closeTo(facetBounds.width, 320, 1);
        assert.closeTo(facetBounds.left - drawerBounds.left, drawerBounds.right - facetBounds.right, 1);
        assert.notEqual(getComputedStyle(drawer).overscrollBehavior, 'auto');
    });

    test('clears modal state when the compact drawer becomes a desktop facet rail', async () => {
        const drawerStates: boolean[] = [];
        const wrapper = await fixture<HTMLElement>(html`
            <div style="container: universal-search-dialog / inline-size; width: 30rem;">
                <relewise-universal-search-facets
                    @universal-search-facets-drawer-state-changed=${(event: CustomEvent<{ open: boolean }>) => drawerStates.push(event.detail.open)}>
                </relewise-universal-search-facets>
            </div>
        `);
        const element = wrapper.querySelector<UniversalSearchFacets>('relewise-universal-search-facets')!;
        const trigger = element.renderRoot.querySelector<HTMLButtonElement>('.rw-trigger')!;
        const drawer = element.renderRoot.querySelector<HTMLElement>('.rw-drawer')!;
        trigger.click();
        await element.updateComplete;

        wrapper.style.width = '64rem';
        await waitUntil(() => !drawer.hasAttribute('open'));

        assert.equal(trigger.getAttribute('aria-expanded'), 'false');
        assert.isNull(drawer.getAttribute('role'));
        assert.isNull(drawer.getAttribute('aria-modal'));
        assert.equal(element.shadowRoot!.activeElement, drawer);
        assert.deepEqual(drawerStates, [true, false]);
    });

    test('supports Light DOM and keeps long labels inside the facet panel', async () => {
        const options = mockRelewiseOptions();
        options.components = { domMode: 'light' };
        initializeRelewiseUI(options);
        useSearch({ universalSearch: {} });

        const element = await fixture<UniversalSearchFacets>(html`
            <relewise-universal-search-facets
                style="display: block; width: 16rem;"
                .facetResult=${facetResult()}
                .labels=${['A deliberately long facet heading']}>
            </relewise-universal-search-facets>
        `);
        await element.updateComplete;
        await new Promise(requestAnimationFrame);

        const label = element.querySelector<HTMLElement>('.rw-label')!;
        assert.isNull(element.shadowRoot);
        assert.isNotNull(element.querySelector('[part~="facet-trigger"]'));
        assert.isNotNull(element.querySelector('[part~="facet-drawer"]'));
        assert.equal(getComputedStyle(label).overflowWrap, 'anywhere');
        assert.isAtMost(label.scrollWidth, label.clientWidth);
        assert.include(document.querySelector('#relewise-light-dom-styles')?.textContent ?? '', '@container universal-search-dialog');
    });
});
