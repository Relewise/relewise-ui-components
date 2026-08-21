import { QueryKeys, getFacetRangeQueryKeyPrefixes } from '../helpers';

const takeQueryKeys = [QueryKeys.take, QueryKeys.productTake, QueryKeys.productCategoryTake, QueryKeys.contentTake];
const facetQueryKeyPrefixes = [QueryKeys.facet, QueryKeys.productFacet, QueryKeys.productCategoryFacet, QueryKeys.contentFacet]
    .flatMap(facetQueryKeyPrefix => [facetQueryKeyPrefix, ...Object.values(getFacetRangeQueryKeyPrefixes(facetQueryKeyPrefix))]);

export function updateUrlStateForUniversalSearchTerm(term: string): void {
    const currentUrl = new URL(window.location.href);

    if (term) {
        currentUrl.searchParams.set(QueryKeys.term, term);
    } else {
        currentUrl.searchParams.delete(QueryKeys.term);
    }

    takeQueryKeys.forEach(queryKey => currentUrl.searchParams.delete(queryKey));
    currentUrl.searchParams.delete(QueryKeys.productSorting);

    const queryParamNames = [...new Set(Array.from(currentUrl.searchParams.keys()))];
    queryParamNames
        .filter(queryParamName => facetQueryKeyPrefixes.some(prefix => queryParamName.startsWith(prefix)))
        .forEach(queryParamName => currentUrl.searchParams.delete(queryParamName));

    if (currentUrl.href === window.location.href) {
        return;
    }

    window.history.replaceState({}, document.title, currentUrl);
}
