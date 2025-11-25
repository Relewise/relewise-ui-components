export type FavoriteChangeDetail = {
    isFavorite: boolean;
    entityType?: 'Product' | 'Content';
    productId?: string;
    variantId?: string | null;
    contentId?: string;
};
