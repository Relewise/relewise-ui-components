import { DoubleNullableRange, ProductSearchRequest, Settings } from '@relewise/client';
import { createProductSearchBuilder } from './productSearchBuilder';
import { RelewiseFacetBuilder } from '../facetBuilder';
import { getRelewiseSearchTargetedConfigurations, getRelewiseUISearchOptions } from '../helpers/relewiseUIOptions';
import { QueryKeys, getFacetRangeQueryKeyPrefixes, readCurrentUrlState, readCurrentUrlStateValues } from '../helpers/urlState';
import { getSearchSortingOptions, getSearchSortingSelection } from './searchSortingBuilder';
import { Facet } from '../search/types';

export type ProductSearchRequestOptions = {
    term: string | null;
    settings: Settings;
    page: number;
    pageSize: number;
    productsLoaded: number;
    productsToFetch: number | null;
    target: string | null;
    facetQueryKeyPrefix?: string;
    sortingQueryKey?: string;
};

export type ProductSearchRequestResult = {
    request: ProductSearchRequest;
    facetLabels: string[];
};

export function buildProductSearchRequest(options: ProductSearchRequestOptions): ProductSearchRequestResult {
    const searchOptions = getRelewiseUISearchOptions();
    const sortingOptions = getSearchSortingOptions(searchOptions?.sorting);
    let facetLabels: string[] = [];

    const requestBuilder = createProductSearchBuilder(options.term, options.settings)
        .pagination(p => p
            .setPageSize(options.productsToFetch && options.productsLoaded < 1 ? options.productsToFetch : options.pageSize)
            .setPage(options.productsToFetch && options.productsLoaded < 1 ? 1 : options.page))
        .facets(builder => {
            if (searchOptions?.facets?.product) {
                const facetBuilder = new RelewiseFacetBuilder(builder);
                searchOptions.facets.product(facetBuilder);
                facetLabels = facetBuilder.getLabels();
            }
        })
        .sorting(builder => {
            const sorting = getSearchSortingSelection(sortingOptions, readCurrentUrlState(options.sortingQueryKey ?? QueryKeys.sortBy));

            if (sorting) {
                sorting.apply(builder);
                return;
            }

            builder.sortByProductRelevance();
        });

    if (options.target) {
        const overwrittenConfigSettings = getRelewiseSearchTargetedConfigurations().handle(options.target, requestBuilder, options.sortingQueryKey);
        if (overwrittenConfigSettings.facetLabels) {
            facetLabels = overwrittenConfigSettings.facetLabels;
        }
    }

    const request = requestBuilder.build();

    applySelectedValuesToProductFacets(request, options);

    return {
        request,
        facetLabels,
    };
}

function applySelectedValuesToProductFacets(request: ProductSearchRequest, options: ProductSearchRequestOptions) {
    if (request.facets) {
        request.facets.items.forEach(facet => {
            applySelectedValuesToProductFacet(facet, options);
        });
    }
}

function applySelectedValuesToProductFacet(facet: Facet, options: ProductSearchRequestOptions, parentKey?: string) {
    const urlKey = getFacetUrlKey(facet, parentKey);

    if (facet.$type.includes('DataObjectFacet') && 'items' in facet) {
        facet.items.forEach(item => applySelectedValuesToProductFacet(item, options, urlKey));
        return;
    }

    if (facet.$type.includes('ProductDataDoubleRangeFacet') ||
        facet.$type.includes('DataObjectDoubleRangeFacet') ||
        facet.$type.includes('PriceRangeFacet')) {
        applySelectedRangeToProductFacet(facet, options, urlKey);
        return;
    }

    if (facet.$type.includes('PriceRangesFacet') ||
        facet.$type.includes('ProductDataDoubleRangesFacet') ||
        facet.$type.includes('DataObjectDoubleRangesFacet')) {
        applySelectedRangesToProductFacet(facet, options, urlKey);
        return;
    }

    applySelectedStringsToProductFacet(facet, options, urlKey);

    if (!facet.settings) {
        facet.settings = { alwaysIncludeSelectedInAvailable: true, includeZeroHitsInAvailable: false };
    }
}

function applySelectedRangeToProductFacet(facet: Facet, options: ProductSearchRequestOptions, urlKey?: string) {
    if ('selected' in facet) {
        const rangeQueryKeyPrefixes = getFacetRangeQueryKeyPrefixes(options.facetQueryKeyPrefix ?? QueryKeys.facet);
        const upperBound = readCurrentUrlState(rangeQueryKeyPrefixes.upperBound + facet.field + (urlKey ?? ''));
        const lowerBound = readCurrentUrlState(rangeQueryKeyPrefixes.lowerBound + facet.field + (urlKey ?? ''));

        facet.selected = {
            lowerBoundInclusive: lowerBound ? +lowerBound : null,
            upperBoundInclusive: upperBound ? +upperBound : null,
        };
    }
}

function applySelectedRangesToProductFacet(facet: Facet, options: ProductSearchRequestOptions, urlKey?: string) {
    if ('selected' in facet) {
        const facetQueryKeyPrefix = options.facetQueryKeyPrefix ?? QueryKeys.facet;
        const queryValues = readCurrentUrlStateValues(facetQueryKeyPrefix + facet.field + (urlKey ?? ''));
        facet.selected = queryValues.map(x => {
            const split = x.split('-');
            return {
                lowerBoundInclusive: +split[0],
                upperBoundExclusive: +split[1],
            } as DoubleNullableRange;
        });
    }
}

function applySelectedStringsToProductFacet(facet: Facet, options: ProductSearchRequestOptions, urlKey?: string) {
    if ('selected' in facet) {
        const facetQueryKeyPrefix = options.facetQueryKeyPrefix ?? QueryKeys.facet;
        facet.selected = readCurrentUrlStateValues(facetQueryKeyPrefix + facet.field + (urlKey ?? ''));
    }
}

function getFacetUrlKey(facet: Facet, parentKey?: string): string | undefined {
    if (!('key' in facet) || !facet.key) {
        return parentKey;
    }

    return parentKey ? `${parentKey}.${facet.key}` : facet.key;
}
