import type {
    ContentSearchRequest,
    ContentSearchResponse,
    ProductCategorySearchRequest,
    ProductCategorySearchResponse,
    ProductSearchRequest,
    ProductSearchResponse,
} from '@relewise/client';

export const universalSearchTabs = ['products', 'productCategories', 'content'] as const;
export type UniversalSearchTab = typeof universalSearchTabs[number];

export type UniversalSearchRequest =
    | { tab: 'products'; request: ProductSearchRequest }
    | { tab: 'productCategories'; request: ProductCategorySearchRequest }
    | { tab: 'content'; request: ContentSearchRequest };

export type UniversalSearchResponses = Partial<{
    products: ProductSearchResponse;
    productCategories: ProductCategorySearchResponse;
    content: ContentSearchResponse;
}>;

export type UniversalSearchResult = ProductSearchResponse | ProductCategorySearchResponse | ContentSearchResponse;
