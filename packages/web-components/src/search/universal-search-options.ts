import { getRelewiseUISearchOptions } from '../helpers';
import { UniversalSearchTab, universalSearchTabs } from './universal-search.types';

export function getEnabledUniversalSearchTabs(): UniversalSearchTab[] {
    const entities = getRelewiseUISearchOptions()?.universalSearch?.entities;

    if (!entities) {
        return ['products'];
    }

    return universalSearchTabs.filter(tab => Boolean(entities?.[tab]));
}

export function getUniversalSearchPageSize(tab: UniversalSearchTab, defaultPageSize: number): number {
    const entities = getRelewiseUISearchOptions()?.universalSearch?.entities;

    if (tab === 'products') {
        return entities?.products?.pageSize ?? defaultPageSize;
    }

    if (tab === 'productCategories') {
        return entities?.productCategories?.pageSize ?? defaultPageSize;
    }

    return entities?.content?.pageSize ?? defaultPageSize;
}
