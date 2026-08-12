import {
    PopularSearchTermsRecommendationBuilder,
    PopularSearchTermsRecommendationRequest,
    SearchTermPredictionBuilder,
    SearchTermPredictionRequest,
    Settings,
} from '@relewise/client';
import type { SearchSuggestionEntityType } from '../app';

type PopularSearchTermsRequestOptions = {
    settings: Settings;
    take: number;
    targetEntityTypes: SearchSuggestionEntityType[];
    term?: string;
};

type SearchTermPredictionRequestOptions = PopularSearchTermsRequestOptions & {
    term: string;
};

export function buildPopularSearchTermsRequest(options: PopularSearchTermsRequestOptions): PopularSearchTermsRecommendationRequest {
    const builder = new PopularSearchTermsRecommendationBuilder(options.settings)
        .addEntityType(...options.targetEntityTypes);

    if (options.term !== undefined) {
        builder.setTerm(options.term);
    }

    builder.recommendationSettings.numberOfRecommendations = options.take;

    return builder.build();
}

export function buildSearchTermPredictionRequest(options: SearchTermPredictionRequestOptions): SearchTermPredictionRequest {
    return new SearchTermPredictionBuilder(options.settings)
        .setTerm(options.term)
        .take(options.take)
        .addEntityType(...options.targetEntityTypes)
        .build();
}
