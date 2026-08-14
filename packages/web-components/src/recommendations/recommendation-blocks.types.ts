export interface RecommendationBlock {
    title?: string;
    type:
        | 'PopularProducts'
        | 'RecentlyViewedProducts'
        | 'PopularProductCategories'
        | 'PopularContents'
        | 'PopularContentCategories'
        | 'PopularSearchTerms'
        | 'SearchTermBasedProduct';
    take?: number;
}

export interface RecommendationBlocksStateChangedEventDetail {
    hasResults: boolean;
    loading: boolean;
}

export interface RecommendationBlocksTermSelectedEventDetail {
    term: string;
}

export const RecommendationBlocksEvents = {
    stateChanged: 'relewise-recommendation-blocks-state-changed',
    termSelected: 'relewise-recommendation-blocks-term-selected',
} as const;
