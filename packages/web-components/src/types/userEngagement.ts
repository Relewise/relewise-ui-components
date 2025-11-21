export type FavoriteChangeDetail = {
    isFavorite: boolean;
    entityType?: 'product' | 'content';
    productId?: string;
    variantId?: string | null;
    contentId?: string;
};

export type FavoriteErrorDetail = FavoriteChangeDetail & {
    error: unknown;
};
