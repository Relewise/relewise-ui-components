import { Settings } from '@relewise/client';
import { buildContentSearchRequest } from './contentSearchRequestBuilder';
import { buildProductCategorySearchRequest } from './productCategorySearchRequestBuilder';
import { buildProductSearchRequest } from './productSearchRequestBuilder';
import { universalSearchTabSettings } from './universal-search-tab-settings';
import { UniversalSearchRequest, UniversalSearchTab } from './universal-search.types';

export type UniversalSearchRequestBuilderOptions = {
    tabs: UniversalSearchTab[];
    term: string;
    settings: Settings;
    target: string | null;
    productsPage: number;
    productCategoriesPage: number;
    contentPage: number;
    productsPageSize: number;
    productCategoriesPageSize: number;
    contentPageSize: number;
    productsLoaded: number;
    productCategoriesLoaded: number;
    contentLoaded: number;
    productsToFetch: number | null;
    productCategoriesToFetch: number | null;
    contentToFetch: number | null;
};

export type UniversalSearchRequestBuilderResult = {
    requests: UniversalSearchRequest[];
    productFacetLabels: string[];
    productCategoryFacetLabels: string[];
    contentFacetLabels: string[];
};

export function buildUniversalSearchRequests(options: UniversalSearchRequestBuilderOptions): UniversalSearchRequestBuilderResult {
    const requests: UniversalSearchRequest[] = [];
    let productFacetLabels: string[] = [];
    let productCategoryFacetLabels: string[] = [];
    let contentFacetLabels: string[] = [];

    if (options.tabs.includes('products')) {
        const tabSettings = universalSearchTabSettings.products;
        const requestResult = buildProductSearchRequest({
            term: options.term,
            settings: options.settings,
            page: options.productsPage,
            pageSize: options.productsPageSize,
            productsLoaded: options.productsLoaded,
            productsToFetch: options.productsToFetch,
            target: options.target,
            facetQueryKeyPrefix: tabSettings.facetQueryKeyPrefix,
            facetUpperboundQueryKeyPrefix: tabSettings.facetUpperboundQueryKeyPrefix,
            facetLowerboundQueryKeyPrefix: tabSettings.facetLowerboundQueryKeyPrefix,
        });
        productFacetLabels = requestResult.facetLabels;
        requests.push({ tab: 'products', request: requestResult.request });
    }

    if (options.tabs.includes('productCategories')) {
        const requestResult = buildProductCategorySearchRequest({
            term: options.term,
            settings: options.settings,
            page: options.productCategoriesToFetch && options.productCategoriesLoaded < 1 ? 1 : options.productCategoriesPage,
            pageSize: options.productCategoriesToFetch && options.productCategoriesLoaded < 1 ? options.productCategoriesToFetch : options.productCategoriesPageSize,
        });
        productCategoryFacetLabels = requestResult.facetLabels;
        requests.push({ tab: 'productCategories', request: requestResult.request });
    }

    if (options.tabs.includes('content')) {
        const requestResult = buildContentSearchRequest({
            term: options.term,
            settings: options.settings,
            page: options.contentToFetch && options.contentLoaded < 1 ? 1 : options.contentPage,
            pageSize: options.contentToFetch && options.contentLoaded < 1 ? options.contentToFetch : options.contentPageSize,
        });
        contentFacetLabels = requestResult.facetLabels;
        requests.push({ tab: 'content', request: requestResult.request });
    }

    return {
        requests,
        productFacetLabels,
        productCategoryFacetLabels,
        contentFacetLabels,
    };
}
