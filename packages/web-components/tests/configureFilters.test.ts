import { assert } from '@esm-bundle/chai';
import { configureFilters, initializeRelewiseUI, Filters } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('configureFilters', () => {
    test('configureFilters composes callbacks', async () => {
        const mockedOptions = mockRelewiseOptions();
        const invocationOrder: string[] = [];
        mockedOptions.filters = {
            product: () => invocationOrder.push('base'),
        } satisfies Filters;

        initializeRelewiseUI(mockedOptions);

        configureFilters({
            product: () => invocationOrder.push('additional'),
        });

        const builder = {} as unknown as Parameters<NonNullable<Filters['product']>>[0];
        window.relewiseUIOptions.filters?.product?.(builder);

        assert.deepEqual(invocationOrder, ['base', 'additional']);
    });
});
