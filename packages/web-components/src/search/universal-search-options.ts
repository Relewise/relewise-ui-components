import { getRelewiseUISearchOptions } from '../helpers';
import { UniversalSearchTab, UniversalSearchTabId, universalSearchTabs } from './universal-search-tab-settings';

const supportedUniversalSearchTabs = new Set<string>(universalSearchTabs);

export function getEnabledUniversalSearchTabs(): UniversalSearchTab[] {
    const entities = getRelewiseUISearchOptions()?.universalSearch?.entities;

    if (!entities) {
        return [UniversalSearchTabId.products];
    }

    return Object.keys(entities)
        .filter((tab): tab is UniversalSearchTab => supportedUniversalSearchTabs.has(tab))
        .filter(tab => Boolean(entities[tab]));
}

export function getUniversalSearchPageSize(tab: UniversalSearchTab, defaultPageSize: number): number {
    const entities = getRelewiseUISearchOptions()?.universalSearch?.entities;
    return entities?.[tab]?.pageSize ?? defaultPageSize;
}
