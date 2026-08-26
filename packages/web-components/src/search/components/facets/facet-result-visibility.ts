import type { FacetResult, FacetResultContainer } from '../../types';

export function shouldRenderFacetResult(facetResult: FacetResult): boolean {
    if (!('available' in facetResult)) {
        return false;
    }

    if (Array.isArray(facetResult.available)) {
        const available = facetResult.available.filter(item => item.value !== undefined);
        return available.length > 1 || available.some(item => item.selected);
    }

    return Boolean(facetResult.available?.value);
}

export function hasRenderableFacets(facetResult: FacetResultContainer | null | undefined): boolean {
    return facetResult?.items?.some(shouldRenderFacetResult) ?? false;
}
