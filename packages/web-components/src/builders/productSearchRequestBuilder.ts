import { ProductSearchRequest, Settings } from '@relewise/client';
import { createProductSearchBuilder } from './productSearchBuilder';
import { RelewiseFacetBuilder } from '../facetBuilder';
import { getRelewiseSearchTargetedConfigurations, getRelewiseUISearchOptions } from '../helpers/relewiseUIOptions';
import { QueryKeys, readCurrentUrlState } from '../helpers/urlState';
import { getSearchSortingOptions, getSearchSortingSelection } from './searchSortingBuilder';
import { applySelectedValuesToFacets } from './facetSelectionHydration';

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

    applySelectedValuesToFacets(request.facets?.items, options.facetQueryKeyPrefix ?? QueryKeys.facet);

    return {
        request,
        facetLabels,
    };
}
