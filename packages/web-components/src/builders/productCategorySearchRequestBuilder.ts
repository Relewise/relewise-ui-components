import { DoubleNullableRange, ProductCategorySearchRequest, Settings } from '@relewise/client';
import { createProductCategorySearchBuilder } from './productCategorySearchBuilder';
import { RelewiseFacetBuilder } from '../facetBuilder';
import { getRelewiseUISearchOptions } from '../helpers/relewiseUIOptions';
import { QueryKeys, readCurrentUrlState, readCurrentUrlStateValues } from '../helpers/urlState';
import { Facet } from '../search/types';

export type ProductCategorySearchRequestOptions = {
    term: string | null;
    settings: Settings;
    page: number;
    pageSize: number;
};

export type ProductCategorySearchRequestResult = {
    request: ProductCategorySearchRequest;
    facetLabels: string[];
};

export function buildProductCategorySearchRequest(options: ProductCategorySearchRequestOptions): ProductCategorySearchRequestResult {
    const searchOptions = getRelewiseUISearchOptions();
    let facetLabels: string[] = [];

    const request = createProductCategorySearchBuilder(options.term, options.settings)
        .pagination(p => p
            .setPageSize(options.pageSize)
            .setPage(options.page))
        .facets(builder => {
            if (searchOptions?.facets?.productCategory) {
                const facetBuilder = new RelewiseFacetBuilder(builder);
                searchOptions.facets.productCategory(facetBuilder);
                facetLabels = facetBuilder.getLabels();
            }
        })
        .build();

    applySelectedValuesToProductCategoryFacets(request);

    return {
        request,
        facetLabels,
    };
}

function applySelectedValuesToProductCategoryFacets(request: ProductCategorySearchRequest) {
    if (request.facets) {
        request.facets.items.forEach(facet => {
            applySelectedValuesToProductCategoryFacet(facet);
        });
    }
}

function applySelectedValuesToProductCategoryFacet(facet: Facet) {
    if (facet.$type.includes('ProductCategoryDataDoubleRangeFacet')) {
        applySelectedRangeToProductCategoryFacet(facet);
        return;
    }

    if (facet.$type.includes('ProductCategoryDataDoubleRangesFacet')) {
        applySelectedRangesToProductCategoryFacet(facet);
        return;
    }

    applySelectedStringsToProductCategoryFacet(facet);

    if (!facet.settings) {
        facet.settings = { alwaysIncludeSelectedInAvailable: true, includeZeroHitsInAvailable: false };
    }
}

function applySelectedRangeToProductCategoryFacet(facet: Facet) {
    if ('selected' in facet) {
        let upperBound = null;
        let lowerBound = null;

        if ('key' in facet) {
            upperBound = readCurrentUrlState(QueryKeys.productCategoryFacetUpperbound + facet.field + facet.key);
            lowerBound = readCurrentUrlState(QueryKeys.productCategoryFacetLowerbound + facet.field + facet.key);
        } else {
            upperBound = readCurrentUrlState(QueryKeys.productCategoryFacetUpperbound + facet.field);
            lowerBound = readCurrentUrlState(QueryKeys.productCategoryFacetLowerbound + facet.field);
        }

        facet.selected = {
            lowerBoundInclusive: lowerBound ? +lowerBound : null,
            upperBoundInclusive: upperBound ? +upperBound : null,
        };
    }
}

function applySelectedRangesToProductCategoryFacet(facet: Facet) {
    if ('selected' in facet) {
        let queryValues = null;
        if ('key' in facet) {
            queryValues = readCurrentUrlStateValues(QueryKeys.productCategoryFacet + facet.field + facet.key);
        } else {
            queryValues = readCurrentUrlStateValues(QueryKeys.productCategoryFacet + facet.field);
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

function applySelectedStringsToProductCategoryFacet(facet: Facet) {
    if ('selected' in facet) {
        let queryValues = null;
        if ('key' in facet) {
            queryValues = readCurrentUrlStateValues(QueryKeys.productCategoryFacet + facet.field + facet.key);
        } else {
            queryValues = readCurrentUrlStateValues(QueryKeys.productCategoryFacet + facet.field);
        }
        facet.selected = queryValues;
    }
}
