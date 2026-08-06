import {
    ContentResult,
    ContentSearchResponse,
    ProductCategoryResult,
    ProductCategorySearchResponse,
    ProductResult,
    ProductSearchResponse,
    User,
} from '@relewise/client';
import { renderUniversalSearchContentTab } from './universal-search-content-tab';
import { renderUniversalSearchProductCategoriesTab } from './universal-search-product-categories-tab';
import { renderUniversalSearchProductsTab } from './universal-search-products-tab';
import { UniversalSearchTab } from './universal-search.types';

export type UniversalSearchActiveTabOptions = {
    activeTab: UniversalSearchTab | null;
    productSearchResult: ProductSearchResponse | null;
    productCategorySearchResult: ProductCategorySearchResponse | null;
    contentSearchResult: ContentSearchResponse | null;
    products: ProductResult[];
    productCategories: ProductCategoryResult[];
    content: ContentResult[];
    productFacetLabels: string[];
    productCategoryFacetLabels: string[];
    contentFacetLabels: string[];
    loading: boolean;
    error: string | null;
    user: User | null;
    target: string | null;
    onLoadMore: () => void;
};

export function renderUniversalSearchActiveTab(options: UniversalSearchActiveTabOptions) {
    if (options.activeTab === 'productCategories') {
        return renderUniversalSearchProductCategoriesTab({
            result: options.productCategorySearchResult,
            productCategories: options.productCategories,
            facetLabels: options.productCategoryFacetLabels,
            loading: options.loading,
            error: options.error,
            user: options.user,
            onLoadMore: options.onLoadMore,
        });
    }

    if (options.activeTab === 'content') {
        return renderUniversalSearchContentTab({
            result: options.contentSearchResult,
            content: options.content,
            facetLabels: options.contentFacetLabels,
            loading: options.loading,
            error: options.error,
            user: options.user,
            onLoadMore: options.onLoadMore,
        });
    }

    return renderUniversalSearchProductsTab({
        result: options.productSearchResult,
        products: options.products,
        facetLabels: options.productFacetLabels,
        loading: options.loading,
        error: options.error,
        user: options.user,
        target: options.target,
        onLoadMore: options.onLoadMore,
    });
}
