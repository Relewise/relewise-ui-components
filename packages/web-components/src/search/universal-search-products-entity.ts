import { ProductResult, ProductSearchRequest, ProductSearchResponse, Searcher } from '@relewise/client';
import { getRelewiseUISearchOptions } from '../helpers';
import { buildProductSearchRequest } from './productSearchRequestBuilder';
import { UniversalSearchEntityBase, UniversalSearchEntityRequestOptions } from './universal-search-entity';
import { UniversalSearchTabId, getUniversalSearchTabQueryKeys } from './universal-search-tab-settings';

const queryKeys = getUniversalSearchTabQueryKeys(UniversalSearchTabId.products);

export class UniversalSearchProductsEntity extends UniversalSearchEntityBase<ProductSearchRequest, ProductSearchResponse, ProductResult> {
    readonly id = UniversalSearchTabId.products;
    protected readonly responseType = 'Relewise.Client.Responses.Search.ProductSearchResponse, Relewise.Client';
    protected readonly defaultTabLabel = 'Products';
    protected readonly defaultError = 'Could not load products.';

    protected get localization() {
        return getRelewiseUISearchOptions()?.localization?.universalSearch?.products;
    }

    protected buildRequest(options: UniversalSearchEntityRequestOptions) {
        return buildProductSearchRequest({
            term: options.term,
            settings: options.settings,
            page: options.page,
            pageSize: options.pageSize,
            productsLoaded: options.resultsLoaded,
            productsToFetch: options.resultsToFetch,
            target: options.target,
            facetQueryKeyPrefix: queryKeys.facet,
            sortingQueryKey: queryKeys.sorting,
        });
    }

    protected executeRequest(searcher: Searcher, request: ProductSearchRequest, abortSignal: AbortSignal) {
        return searcher.searchProducts(request, { abortSignal });
    }
}
