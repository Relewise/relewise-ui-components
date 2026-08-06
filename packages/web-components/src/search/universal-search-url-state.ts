import { QueryKeys, readCurrentUrlState } from '../helpers';
import { UniversalSearchTab } from './universal-search.types';
import { universalSearchFacetQueryKeyPrefixes, universalSearchTabSettings, universalSearchTakeQueryKeys } from './universal-search-tab-settings';

export function getNumberOfUniversalSearchResultsToFetch(tab: UniversalSearchTab): number | null {
    const value = readCurrentUrlState(universalSearchTabSettings[tab].takeQueryKey);

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

    universalSearchTakeQueryKeys.forEach(queryKey => currentUrl.searchParams.delete(queryKey));

    const queryParamNames = [...new Set(Array.from(currentUrl.searchParams.keys()))];

    queryParamNames
        .filter(queryParamName => universalSearchFacetQueryKeyPrefixes.some(prefix => queryParamName.startsWith(prefix)))
        .forEach(queryParamName => currentUrl.searchParams.delete(queryParamName));

    window.history.replaceState({}, document.title, currentUrl);
}
