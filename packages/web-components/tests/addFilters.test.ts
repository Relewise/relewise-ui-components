import { assert } from '@esm-bundle/chai';
import { addFilters, initializeRelewiseUI, Filters } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('addFilters', () => {
    test('addFilters composes callbacks', () => {
        const mockedOptions = mockRelewiseOptions();
        const invocationOrder: string[] = [];
        mockedOptions.filters = {
            product: () => invocationOrder.push('base'),
        } satisfies Filters;

        initializeRelewiseUI(mockedOptions);

        addFilters({
            product: () => invocationOrder.push('additional'),
        });

        const builder = {} as unknown as Parameters<NonNullable<Filters['product']>>[0];
        window.relewiseUIOptions.filters?.product?.(builder);

        assert.deepEqual(invocationOrder, ['base', 'additional']);
    });

    test('addFilters composes content category callbacks', () => {
        const mockedOptions = mockRelewiseOptions();
        const invocationOrder: string[] = [];
        mockedOptions.filters = {
            contentCategory: () => invocationOrder.push('base'),
        } satisfies Filters;

        initializeRelewiseUI(mockedOptions);

        addFilters({
            contentCategory: () => invocationOrder.push('additional'),
        });

        const builder = {} as unknown as Parameters<NonNullable<Filters['contentCategory']>>[0];
        window.relewiseUIOptions.filters?.contentCategory?.(builder);

        assert.deepEqual(invocationOrder, ['base', 'additional']);
    });
});
