import { deserializeFacetRange, FacetRange } from '../helpers/facetRangeUrlCodec';
import { getFacetRangeQueryKeyPrefixes, readCurrentUrlState, readCurrentUrlStateValues } from '../helpers/urlState';
import { Facet } from '../search/types';

export function applySelectedValuesToFacets(facets: Facet[] | undefined, facetQueryKeyPrefix: string) {
    facets?.forEach(facet => applySelectedValuesToFacet(facet, facetQueryKeyPrefix));
}

function applySelectedValuesToFacet(facet: Facet, facetQueryKeyPrefix: string, parentKey?: string) {
    const urlKey = getFacetUrlKey(facet, parentKey);

    if (facet.$type.includes('DataObjectFacet') && 'items' in facet) {
        facet.items.forEach(item => applySelectedValuesToFacet(item, facetQueryKeyPrefix, urlKey));
        return;
    }

    if (facet.$type.includes('DoubleRangeFacet') || facet.$type.includes('PriceRangeFacet')) {
        applySelectedRangeToFacet(facet, facetQueryKeyPrefix, urlKey);
        return;
    }

    if (facet.$type.includes('DoubleRangesFacet') || facet.$type.includes('PriceRangesFacet')) {
        applySelectedRangesToFacet(facet, facetQueryKeyPrefix, urlKey);
        return;
    }

    if ('selected' in facet) {
        facet.selected = readCurrentUrlStateValues(getFacetQueryKey(facet, facetQueryKeyPrefix, urlKey));
    }

    if (!facet.settings) {
        facet.settings = { alwaysIncludeSelectedInAvailable: true, includeZeroHitsInAvailable: false };
    }
}

function applySelectedRangeToFacet(facet: Facet, facetQueryKeyPrefix: string, urlKey?: string) {
    if (!('selected' in facet)) {
        return;
    }

    const rangeQueryKeyPrefixes = getFacetRangeQueryKeyPrefixes(facetQueryKeyPrefix);
    facet.selected = {
        lowerBoundInclusive: parseNullableNumber(readCurrentUrlState(getFacetQueryKey(facet, rangeQueryKeyPrefixes.lowerBound, urlKey))),
        upperBoundInclusive: parseNullableNumber(readCurrentUrlState(getFacetQueryKey(facet, rangeQueryKeyPrefixes.upperBound, urlKey))),
    };
}

function applySelectedRangesToFacet(facet: Facet, facetQueryKeyPrefix: string, urlKey?: string) {
    if (!('selected' in facet)) {
        return;
    }

    facet.selected = readCurrentUrlStateValues(getFacetQueryKey(facet, facetQueryKeyPrefix, urlKey))
        .map(deserializeFacetRange)
        .filter((range): range is FacetRange => range !== null);
}

function getFacetQueryKey(facet: Facet, prefix: string, urlKey?: string): string {
    return prefix + facet.field + (urlKey ?? '');
}

function getFacetUrlKey(facet: Facet, parentKey?: string): string | undefined {
    if (!('key' in facet) || !facet.key) {
        return parentKey;
    }

    return parentKey ? `${parentKey}.${facet.key}` : facet.key;
}

function parseNullableNumber(value: string | null): number | null {
    if (value === null || value.trim() === '') {
        return null;
    }

    const parsedValue = Number(value);
    return Number.isNaN(parsedValue) ? null : parsedValue;
}
