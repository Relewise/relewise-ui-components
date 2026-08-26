import { createContext } from '@lit/context';
import { ContentRecommendationRequest, ContentRecommendationResponse } from '@relewise/client';

export type ContentRecommendationBatchingContextValue = {
    enabled?: boolean;
    requests: Array<{
        request: ContentRecommendationRequest;
        id: EventTarget | null;
        result?: ContentRecommendationResponse | null;
    }>;
};

export const contentRecommendationBatchingContext = createContext<ContentRecommendationBatchingContextValue>(Symbol('content-recommendation-batching'));
