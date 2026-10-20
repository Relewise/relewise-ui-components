import {
    PopularSearchTermsRecommendationBuilder,
    PopularSearchTermsRecommendationRequest,
    SearchTermPredictionBuilder,
    SearchTermPredictionRequest,
    Settings,
} from '@relewise/client';
import type { SearchSuggestionEntityType } from '../app';
import { mergeContextValues } from '../helpers/contextValues';
import { getRelewiseUIOptions, getRelewiseUISearchOptions } from '../helpers/relewiseUIOptions';

type PopularSearchTermsRequestOptions = {
    settings: Settings;
    take: number;
    targetEntityTypes: SearchSuggestionEntityType[];
};

type SearchTermPredictionRequestOptions = PopularSearchTermsRequestOptions & {
    term: string;
};

export function buildPopularSearchTermsRequest(options: PopularSearchTermsRequestOptions): PopularSearchTermsRecommendationRequest {
    const relewiseUIOptions = getRelewiseUIOptions();
    const searchOptions = getRelewiseUISearchOptions();
    const builder = new PopularSearchTermsRecommendationBuilder(options.settings)
        .contextValues(mergeContextValues(relewiseUIOptions.contextValues, searchOptions?.contextValues))
        .addEntityType(...options.targetEntityTypes);

    builder.recommendationSettings.numberOfRecommendations = options.take;

    return builder.build();
}

export function buildSearchTermPredictionRequest(options: SearchTermPredictionRequestOptions): SearchTermPredictionRequest {
    const relewiseUIOptions = getRelewiseUIOptions();
    const searchOptions = getRelewiseUISearchOptions();
    return new SearchTermPredictionBuilder(options.settings)
        .contextValues(mergeContextValues(relewiseUIOptions.contextValues, searchOptions?.contextValues))
        .setTerm(options.term)
        .take(options.take)
        .addEntityType(...options.targetEntityTypes)
        .build();
}
