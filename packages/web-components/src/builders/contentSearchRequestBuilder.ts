import { ContentSearchBuilder, ContentSearchRequest, Settings } from '@relewise/client';
import { getSelectedContentProperties } from '../defaultSettings';
import { RelewiseFacetBuilder } from '../facetBuilder';
import { getRelewiseUIOptions, getRelewiseUISearchOptions } from '../helpers/relewiseUIOptions';
import { QueryKeys } from '../helpers/urlState';
import { applySelectedValuesToFacets } from './facetSelectionHelpers';

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

    applySelectedValuesToFacets(request.facets?.items, QueryKeys.contentFacet);

    return {
        request,
        facetLabels,
    };
}
