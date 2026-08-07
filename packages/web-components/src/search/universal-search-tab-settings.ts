import { QueryKeys } from '../helpers';

export type UniversalSearchTab = 'products' | 'productCategories' | 'content';
export const UniversalSearchTabId = {
    products: 'products',
    productCategories: 'productCategories',
    content: 'content',
} as const satisfies { [Tab in UniversalSearchTab]: Tab };
export const universalSearchTabs: UniversalSearchTab[] = Object.values(UniversalSearchTabId);

export type UniversalSearchTabSettings = {
    takeQueryKey: string;
    sortingQueryKey?: string;
    facetQueryKeyPrefix: string;
    facetUpperboundQueryKeyPrefix: string;
    facetLowerboundQueryKeyPrefix: string;
};

export const universalSearchTabSettings = {
    [UniversalSearchTabId.products]: {
        takeQueryKey: QueryKeys.productTake,
        sortingQueryKey: QueryKeys.productSorting,
        facetQueryKeyPrefix: QueryKeys.productFacet,
        facetUpperboundQueryKeyPrefix: QueryKeys.productFacetUpperbound,
        facetLowerboundQueryKeyPrefix: QueryKeys.productFacetLowerbound,
    },
    [UniversalSearchTabId.productCategories]: {
        takeQueryKey: QueryKeys.productCategoryTake,
        facetQueryKeyPrefix: QueryKeys.productCategoryFacet,
        facetUpperboundQueryKeyPrefix: QueryKeys.productCategoryFacetUpperbound,
        facetLowerboundQueryKeyPrefix: QueryKeys.productCategoryFacetLowerbound,
    },
    [UniversalSearchTabId.content]: {
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

export const universalSearchSortingQueryKeys = universalSearchTabs.flatMap(tab => {
    const settings = universalSearchTabSettings[tab];
    return 'sortingQueryKey' in settings ? [settings.sortingQueryKey] : [];
});

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
