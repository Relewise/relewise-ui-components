export type UniversalSearchTab = 'products' | 'productCategories' | 'content';
export const UniversalSearchTabId = {
    products: 'products',
    productCategories: 'productCategories',
    content: 'content',
} as const satisfies { [Tab in UniversalSearchTab]: Tab };
export const universalSearchTabs: UniversalSearchTab[] = Object.values(UniversalSearchTabId);

const universalSearchTabUrlSegments = {
    [UniversalSearchTabId.products]: 'product',
    [UniversalSearchTabId.productCategories]: 'product-category',
    [UniversalSearchTabId.content]: 'content',
} satisfies Record<UniversalSearchTab, string>;

export function getUniversalSearchTabQueryKeys(tab: UniversalSearchTab) {
    const prefix = `rw-${universalSearchTabUrlSegments[tab]}-`;

    return {
        take: `${prefix}take`,
        sorting: `${prefix}sorting`,
        facet: `${prefix}facet-`,
    };
}
