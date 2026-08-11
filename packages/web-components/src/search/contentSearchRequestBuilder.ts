import { ContentSearchBuilder, ContentSearchRequest, DoubleNullableRange, Settings } from '@relewise/client';
import { getSelectedContentProperties } from '../defaultSettings';
import { RelewiseFacetBuilder } from '../facetBuilder';
import { getRelewiseUIOptions, getRelewiseUISearchOptions } from '../helpers/relewiseUIOptions';
import { QueryKeys, readCurrentUrlState, readCurrentUrlStateValues } from '../helpers/urlState';
import { Facet } from './types';

export type ContentSearchRequestOptions = {
    term: string | null;
    settings: Settings;
    page: number;
    pageSize: number;
};

export type ContentSearchRequestResult = {
    request: ContentSearchRequest;
    facetLabels: string[];
};

export function buildContentSearchRequest(options: ContentSearchRequestOptions): ContentSearchRequestResult {
    const relewiseUIOptions = getRelewiseUIOptions();
    const searchOptions = getRelewiseUISearchOptions();
    let facetLabels: string[] = [];

    const request = new ContentSearchBuilder(options.settings)
        .setContentProperties(getSelectedContentProperties(relewiseUIOptions))
        .setTerm(options.term)
        .pagination(p => p
            .setPageSize(options.pageSize)
            .setPage(options.page))
        .relevanceModifiers(builder => {
            if (relewiseUIOptions.relevanceModifiers?.content) {
                relewiseUIOptions.relevanceModifiers.content(builder);
            }
        })
        .filters(builder => {
            if (relewiseUIOptions.filters?.content) {
                relewiseUIOptions.filters.content(builder);
            }
            if (searchOptions?.filters?.content) {
                searchOptions.filters.content(builder);
            }
        })
        .facets(builder => {
            if (searchOptions?.facets?.content) {
                const facetBuilder = new RelewiseFacetBuilder(builder);
                searchOptions.facets.content(facetBuilder);
                facetLabels = facetBuilder.getLabels();
            }
        })
        .build();

    applySelectedValuesToContentFacets(request);

    return {
        request,
        facetLabels,
    };
}

function applySelectedValuesToContentFacets(request: ContentSearchRequest) {
    if (request.facets) {
        request.facets.items.forEach(facet => {
            applySelectedValuesToContentFacet(facet);
        });
    }
}

function applySelectedValuesToContentFacet(facet: Facet) {
    if (facet.$type.includes('ContentDataDoubleRangeFacet')) {
        applySelectedRangeToContentFacet(facet);
        return;
    }

    if (facet.$type.includes('ContentDataDoubleRangesFacet')) {
        applySelectedRangesToContentFacet(facet);
        return;
    }

    applySelectedStringsToContentFacet(facet);

    if (!facet.settings) {
        facet.settings = { alwaysIncludeSelectedInAvailable: true, includeZeroHitsInAvailable: false };
    }
}

function applySelectedRangeToContentFacet(facet: Facet) {
    if ('selected' in facet) {
        let upperBound = null;
        let lowerBound = null;

        if ('key' in facet) {
            upperBound = readCurrentUrlState(QueryKeys.contentFacetUpperbound + facet.field + facet.key);
            lowerBound = readCurrentUrlState(QueryKeys.contentFacetLowerbound + facet.field + facet.key);
        } else {
            upperBound = readCurrentUrlState(QueryKeys.contentFacetUpperbound + facet.field);
            lowerBound = readCurrentUrlState(QueryKeys.contentFacetLowerbound + facet.field);
        }

        facet.selected = {
            lowerBoundInclusive: lowerBound ? +lowerBound : null,
            upperBoundInclusive: upperBound ? +upperBound : null,
        };
    }
}

function applySelectedRangesToContentFacet(facet: Facet) {
    if ('selected' in facet) {
        let queryValues = null;
        if ('key' in facet) {
            queryValues = readCurrentUrlStateValues(QueryKeys.contentFacet + facet.field + facet.key);
        } else {
            queryValues = readCurrentUrlStateValues(QueryKeys.contentFacet + facet.field);
        }
        facet.selected = queryValues.map(x => {
            const split = x.split('-');
            return {
                lowerBoundInclusive: +split[0],
                upperBoundExclusive: +split[1],
            } as DoubleNullableRange;
        });
    }
}

function applySelectedStringsToContentFacet(facet: Facet) {
    if ('selected' in facet) {
        let queryValues = null;
        if ('key' in facet) {
            queryValues = readCurrentUrlStateValues(QueryKeys.contentFacet + facet.field + facet.key);
        } else {
            queryValues = readCurrentUrlStateValues(QueryKeys.contentFacet + facet.field);
        }
        facet.selected = queryValues;
    }
}
