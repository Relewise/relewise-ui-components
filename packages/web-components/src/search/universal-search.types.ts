import type {
    ContentSearchRequest,
    ProductCategorySearchRequest,
    ProductSearchRequest,
    SearchResponseCollection,
    Settings,
} from '@relewise/client';

export const universalSearchTabs = ['products', 'productCategories', 'content'] as const;
export type UniversalSearchTab = typeof universalSearchTabs[number];

export type UniversalSearchRequest = ProductSearchRequest | ProductCategorySearchRequest | ContentSearchRequest;

export type UniversalSearchBatchSearch = {
    request: UniversalSearchRequest;
    applyResponse: (response: SearchResponseCollection) => void;
    setError: () => void;
};

export interface UniversalSearchBatchTab {
    prepareBatchSearch(settings: Settings): UniversalSearchBatchSearch;
}
