import { ProductCategoryResult, ProductCategorySearchRequest, ProductCategorySearchResponse, Searcher } from '@relewise/client';
import { getRelewiseUISearchOptions } from '../helpers';
import { buildProductCategorySearchRequest } from './productCategorySearchRequestBuilder';
import { UniversalSearchEntityBase, UniversalSearchEntityRequestOptions } from './universal-search-entity';
import { UniversalSearchTabId } from './universal-search-tab-settings';

export class UniversalSearchProductCategoriesEntity extends UniversalSearchEntityBase<ProductCategorySearchRequest, ProductCategorySearchResponse, ProductCategoryResult> {
    readonly id = UniversalSearchTabId.productCategories;
    protected readonly responseType = 'Relewise.Client.Responses.Search.ProductCategorySearchResponse, Relewise.Client';
    protected readonly defaultTabLabel = 'Categories';
    protected readonly defaultError = 'Could not load categories.';

    protected get localization() {
        return getRelewiseUISearchOptions()?.localization?.universalSearch?.productCategories;
    }

    protected buildRequest(options: UniversalSearchEntityRequestOptions) {
        const pagination = this.resolvePagination(options);
        return buildProductCategorySearchRequest({
            term: options.term,
            settings: options.settings,
            page: pagination.page,
            pageSize: pagination.pageSize,
        });
    }

    protected executeRequest(searcher: Searcher, request: ProductCategorySearchRequest, abortSignal: AbortSignal) {
        return searcher.searchProductCategories(request, { abortSignal });
    }
}
