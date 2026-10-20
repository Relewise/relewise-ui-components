import {
    PopularSearchTermsRecommendationBuilder,
    PopularSearchTermsRecommendationRequest,
    SearchTermPredictionBuilder,
    SearchTermPredictionRequest,
    Settings,
} from '@relewise/client';
import type { SearchSuggestionEntityType } from '../app';
import { resolveContextValues } from '../helpers/contextValues';
import { getRelewiseUIOptions, getRelewiseUISearchOptions } from '../helpers/relewiseUIOptions';

type PopularSearchTermsRequestOptions = {
    settings: Settings;
    take: number;
    targetEntityTypes: SearchSuggestionEntityType[];
};

type SearchTermPredictionRequestOptions = PopularSearchTermsRequestOptions & {
    term: string;
};

export async function buildPopularSearchTermsRequest(options: PopularSearchTermsRequestOptions): Promise<PopularSearchTermsRecommendationRequest> {
    const relewiseUIOptions = getRelewiseUIOptions();
    const searchOptions = getRelewiseUISearchOptions();
    const contextValues = await resolveContextValues(
        relewiseUIOptions.getContextValues,
        searchOptions?.getContextValues,
    );
    const builder = new PopularSearchTermsRecommendationBuilder(options.settings)
        .contextValues(contextValues)
        .addEntityType(...options.targetEntityTypes);

    builder.recommendationSettings.numberOfRecommendations = options.take;

    return builder.build();
}

export async function buildSearchTermPredictionRequest(options: SearchTermPredictionRequestOptions): Promise<SearchTermPredictionRequest> {
    const relewiseUIOptions = getRelewiseUIOptions();
    const searchOptions = getRelewiseUISearchOptions();
    const contextValues = await resolveContextValues(
        relewiseUIOptions.getContextValues,
        searchOptions?.getContextValues,
    );
    return new SearchTermPredictionBuilder(options.settings)
        .contextValues(contextValues)
        .setTerm(options.term)
        .take(options.take)
        .addEntityType(...options.targetEntityTypes)
        .build();
}
