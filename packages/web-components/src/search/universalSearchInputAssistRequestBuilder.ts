import {
    PopularSearchTermsRecommendationBuilder,
    PopularSearchTermsRecommendationRequest,
    SearchTermPredictionBuilder,
    SearchTermPredictionRequest,
    Settings,
} from '@relewise/client';
import type { UniversalSearchTab } from './universal-search.types';

const inputAssistEntityTypeByTab = {
    products: 'Product',
    productCategories: 'ProductCategory',
    content: 'Content',
} as const satisfies Record<UniversalSearchTab, 'Product' | 'ProductCategory' | 'Content'>;

type PopularSearchTermsRequestOptions = {
    settings: Settings;
    take: number;
    tabs: UniversalSearchTab[];
};

type SearchTermPredictionRequestOptions = PopularSearchTermsRequestOptions & {
    term: string;
};

export function buildPopularSearchTermsRequest(options: PopularSearchTermsRequestOptions): PopularSearchTermsRecommendationRequest {
    const builder = new PopularSearchTermsRecommendationBuilder(options.settings)
        .addEntityType(...options.tabs.map(tab => inputAssistEntityTypeByTab[tab]));

    builder.recommendationSettings.numberOfRecommendations = options.take;

    return builder.build();
}

export function buildSearchTermPredictionRequest(options: SearchTermPredictionRequestOptions): SearchTermPredictionRequest {
    return new SearchTermPredictionBuilder(options.settings)
        .setTerm(options.term)
        .take(options.take)
        .addEntityType(...options.tabs.map(tab => inputAssistEntityTypeByTab[tab]))
        .build();
}
