import type { SearchResponseCollection, SearchTermPredictionRequest } from '@relewise/client';

export type SearchSuggestionsBatchSearch = {
    request: SearchTermPredictionRequest;
    applyResponse: (response: SearchResponseCollection) => void;
    setError: () => void;
};

export interface SearchComboboxTermEventDetail {
    term: string;
}
