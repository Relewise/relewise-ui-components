import { createContext } from '@lit/context';
import { ContentRecommendationRequest, ContentRecommendationResponse } from '@relewise/client';
import { RecommendationBatchingContextValue } from '../recommendation-batching';

export type ContentRecommendationBatchingContextValue =
    RecommendationBatchingContextValue<ContentRecommendationRequest, ContentRecommendationResponse>;

export const contentRecommendationBatchingContext = createContext<ContentRecommendationBatchingContextValue>(Symbol('content-recommendation-batching'));
