import { FilterBuilder } from '@relewise/client';
import { Filters } from './initialize';
import { getRelewiseUIOptions } from './helpers/relewiseUIOptions';
import { deferFiltersConfiguration, resolveFiltersConfiguration, waitForFiltersConfiguration } from './helpers/filtersGate';

function composeFilterCallbacks(
    existing: ((builder: FilterBuilder) => void) | undefined,
    incoming: ((builder: FilterBuilder) => void) | undefined,
): ((builder: FilterBuilder) => void) | undefined {
    if (!existing) {
        return incoming;
    }

    if (!incoming) {
        return existing;
    }

    return builder => {
        existing(builder);
        incoming(builder);
    };
}

export function configureFilters(filters: Partial<Filters>): void {
    const options = getRelewiseUIOptions();
    options.filters = options.filters ?? {};

    if (filters.product) {
        options.filters.product = composeFilterCallbacks(options.filters.product, filters.product);
    }

    if (filters.productCategory) {
        options.filters.productCategory = composeFilterCallbacks(options.filters.productCategory, filters.productCategory);
    }

    if (filters.content) {
        options.filters.content = composeFilterCallbacks(options.filters.content, filters.content);
    }

    resolveFiltersConfiguration();
}

export { deferFiltersConfiguration, waitForFiltersConfiguration, resolveFiltersConfiguration } from './helpers/filtersGate';
