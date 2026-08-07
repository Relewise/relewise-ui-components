import type {
    ContentSearchRequest,
    ContentSearchResponse,
    ContentResult,
    ProductCategorySearchRequest,
    ProductCategorySearchResponse,
    ProductCategoryResult,
    ProductSearchRequest,
    ProductSearchResponse,
    ProductResult,
} from '@relewise/client';
import { UniversalSearchTab, universalSearchTabs } from './universal-search-tab-settings';

export { universalSearchTabs };
export type { UniversalSearchTab };

export type UniversalSearchRequest = ProductSearchRequest | ProductCategorySearchRequest | ContentSearchRequest;
export type UniversalSearchResult = ProductSearchResponse | ProductCategorySearchResponse | ContentSearchResponse;
export type UniversalSearchResultItem = ProductResult | ProductCategoryResult | ContentResult;
