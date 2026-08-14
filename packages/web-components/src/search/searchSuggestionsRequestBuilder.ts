import {
    SearchTermPredictionBuilder,
    SearchTermPredictionRequest,
    Settings,
} from '@relewise/client';
import type { SearchSuggestionEntityType } from '../app';

type SearchTermPredictionRequestOptions = {
    settings: Settings;
    take: number;
    targetEntityTypes: SearchSuggestionEntityType[];
    term: string;
};

export function buildSearchTermPredictionRequest(options: SearchTermPredictionRequestOptions): SearchTermPredictionRequest {
    return new SearchTermPredictionBuilder(options.settings)
        .setTerm(options.term)
        .take(options.take)
        .addEntityType(...options.targetEntityTypes)
        .build();
}
