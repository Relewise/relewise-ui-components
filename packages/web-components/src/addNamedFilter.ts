import { FilterBuilder } from '@relewise/client';
import { getRelewiseNamedFilters } from './helpers';

export function addNamedFilter(options: {
        name: string;
        builder: (builder: FilterBuilder) => void;
    }) {

    const namedFilters = getRelewiseNamedFilters();

    namedFilters.add(options);
}