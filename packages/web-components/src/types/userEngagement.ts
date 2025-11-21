export type FavoriteChangeDetail = {
    isFavorite: boolean;
    entityType?: 'product' | 'content';
    productId?: string;
    variantId?: string | null;
    contentId?: string;
};
