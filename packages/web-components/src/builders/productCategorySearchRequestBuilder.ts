import { ProductCategorySearchRequest, Settings } from '@relewise/client';
import { createProductCategorySearchBuilder } from './productCategorySearchBuilder';
import { RelewiseFacetBuilder } from '../facetBuilder';
import { getRelewiseUISearchOptions } from '../helpers/relewiseUIOptions';
import { QueryKeys } from '../helpers/urlState';
import { applySelectedValuesToFacets } from './facetSelectionHelpers';

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

    applySelectedValuesToFacets(request.facets?.items, QueryKeys.productCategoryFacet);

    return {
        request,
        facetLabels,
    };
}
