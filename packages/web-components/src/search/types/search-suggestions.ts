import type { SearchTermPredictionRequest } from '@relewise/client';

export interface SearchSuggestionsOptions {
    popularSearchTerms?: {
        take?: number;
    };
    searchTermPredictions?: {
        take?: number;
    };
}

export type SearchSuggestionEntityType = NonNullable<
    NonNullable<SearchTermPredictionRequest['settings']>['targetEntityTypes']
>[number];
