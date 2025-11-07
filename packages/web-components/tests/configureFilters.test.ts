import { assert } from '@esm-bundle/chai';
import { configureFilters, deferFiltersConfiguration, waitForFiltersConfiguration, initializeRelewiseUI, Filters } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('configureFilters', () => {
    test('configureFilters composes callbacks and resolves gate', async () => {
        const mockedOptions = mockRelewiseOptions();
        const invocationOrder: string[] = [];
        mockedOptions.filters = {
            product: () => invocationOrder.push('base'),
        } satisfies Filters;

        initializeRelewiseUI(mockedOptions);
        deferFiltersConfiguration();

        let gateResolved = false;
        waitForFiltersConfiguration().then(() => {
            gateResolved = true;
        });

        await new Promise(r => setTimeout(r, 0));

        assert.isFalse(gateResolved, 'filters gate should remain pending until configureFilters resolves it');

        configureFilters({
            product: () => invocationOrder.push('additional'),
        });

        await waitForFiltersConfiguration();

        const builder = {} as unknown as Parameters<NonNullable<Filters['product']>>[0];
        window.relewiseUIOptions.filters?.product?.(builder);

        assert.deepEqual(invocationOrder, ['base', 'additional']);
        assert.isTrue(gateResolved, 'filters gate should resolve after configureFilters call');
    });
});
