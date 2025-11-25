export type FavoriteChangeDetail = {
    isFavorite: boolean;
    entityType?: 'Product' | 'Content';
    productId?: string;
    variantId?: string | null;
    contentId?: string;
};

export type SentimentChangeDetail = {
    sentiment: 'Like' | 'Dislike' | null;
    entityType?: 'Product' | 'Content';
    productId?: string;
    variantId?: string | null;
    contentId?: string;
};
