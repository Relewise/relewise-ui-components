import type { FacetResult, FacetResultContainer } from '../../types';

export function shouldRenderFacetResult(facetResult: FacetResult, totalHits?: number): boolean {
    if (!('available' in facetResult)) {
        return false;
    }

    if (Array.isArray(facetResult.available)) {
        const available = facetResult.available.filter(item => item.value !== undefined);
        if (available.some(item => item.selected)) {
            return true;
        }

        return available.length > 1
            || (available.length === 1 && totalHits !== undefined && available[0].hits !== totalHits);
    }

    return Boolean(facetResult.available?.value);
}

export function hasRenderableFacets(
    facetResult: FacetResultContainer | null | undefined,
    totalHits?: number,
): boolean {
    return facetResult?.items?.some(item => shouldRenderFacetResult(item, totalHits)) ?? false;
}
