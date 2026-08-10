import { QueryKeys, getFacetRangeQueryKeyPrefixes, readCurrentUrlState } from '../helpers';
import { UniversalSearchTab } from './universal-search.types';
import { UniversalSearchTabId, getUniversalSearchTabQueryKeys, universalSearchTabs } from './universal-search-tab-settings';

const tabQueryKeys = universalSearchTabs.map(getUniversalSearchTabQueryKeys);
const takeQueryKeys = [QueryKeys.take, ...tabQueryKeys.map(queryKeys => queryKeys.take)];
const sortingQueryKeys = [getUniversalSearchTabQueryKeys(UniversalSearchTabId.products).sorting];
const facetQueryKeyPrefixes = [QueryKeys.facet, ...tabQueryKeys.map(queryKeys => queryKeys.facet)]
    .flatMap(facetQueryKeyPrefix => [facetQueryKeyPrefix, ...Object.values(getFacetRangeQueryKeyPrefixes(facetQueryKeyPrefix))]);

export function getNumberOfUniversalSearchResultsToFetch(tab: UniversalSearchTab): number | null {
    const value = readCurrentUrlState(getUniversalSearchTabQueryKeys(tab).take);

    if (!value) {
        return null;
    }

    const parsedValue = parseInt(value, 10);

    if (isNaN(parsedValue)) {
        return null;
    }

    return parsedValue;
}

export function updateUrlStateForUniversalSearchTerm(term: string): void {
    const currentUrl = new URL(window.location.href);

    if (term) {
        currentUrl.searchParams.set(QueryKeys.term, term);
    } else {
        currentUrl.searchParams.delete(QueryKeys.term);
    }

    takeQueryKeys.forEach(queryKey => currentUrl.searchParams.delete(queryKey));
    sortingQueryKeys.forEach(queryKey => currentUrl.searchParams.delete(queryKey));

    const queryParamNames = [...new Set(Array.from(currentUrl.searchParams.keys()))];

    queryParamNames
        .filter(queryParamName => facetQueryKeyPrefixes.some(prefix => queryParamName.startsWith(prefix)))
        .forEach(queryParamName => currentUrl.searchParams.delete(queryParamName));

    window.history.replaceState({}, document.title, currentUrl);
}
