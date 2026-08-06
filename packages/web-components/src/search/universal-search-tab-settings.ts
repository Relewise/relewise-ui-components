import { QueryKeys } from '../helpers';
import { UniversalSearchTab, universalSearchTabs } from './universal-search.types';

export type UniversalSearchTabSettings = {
    takeQueryKey: string;
    sortingQueryKey?: string;
    facetQueryKeyPrefix: string;
    facetUpperboundQueryKeyPrefix: string;
    facetLowerboundQueryKeyPrefix: string;
};

export const universalSearchTabSettings = {
    products: {
        takeQueryKey: QueryKeys.productTake,
        sortingQueryKey: QueryKeys.productSorting,
        facetQueryKeyPrefix: QueryKeys.productFacet,
        facetUpperboundQueryKeyPrefix: QueryKeys.productFacetUpperbound,
        facetLowerboundQueryKeyPrefix: QueryKeys.productFacetLowerbound,
    },
    productCategories: {
        takeQueryKey: QueryKeys.productCategoryTake,
        facetQueryKeyPrefix: QueryKeys.productCategoryFacet,
        facetUpperboundQueryKeyPrefix: QueryKeys.productCategoryFacetUpperbound,
        facetLowerboundQueryKeyPrefix: QueryKeys.productCategoryFacetLowerbound,
    },
    content: {
        takeQueryKey: QueryKeys.contentTake,
        facetQueryKeyPrefix: QueryKeys.contentFacet,
        facetUpperboundQueryKeyPrefix: QueryKeys.contentFacetUpperbound,
        facetLowerboundQueryKeyPrefix: QueryKeys.contentFacetLowerbound,
    },
} satisfies Record<UniversalSearchTab, UniversalSearchTabSettings>;

export const universalSearchTakeQueryKeys = [
    QueryKeys.take,
    ...universalSearchTabs.map(tab => universalSearchTabSettings[tab].takeQueryKey),
];

export const universalSearchSortingQueryKeys = [
    universalSearchTabSettings.products.sortingQueryKey,
];

export const universalSearchFacetQueryKeyPrefixes = [
    QueryKeys.facet,
    QueryKeys.facetUpperbound,
    QueryKeys.facetLowerbound,
    ...universalSearchTabs.flatMap(tab => [
        universalSearchTabSettings[tab].facetQueryKeyPrefix,
        universalSearchTabSettings[tab].facetUpperboundQueryKeyPrefix,
        universalSearchTabSettings[tab].facetLowerboundQueryKeyPrefix,
    ]),
];
