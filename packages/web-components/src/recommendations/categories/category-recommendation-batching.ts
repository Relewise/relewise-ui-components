import {
    ContentCategoryRecommendationResponse,
    PopularContentCategoriesRecommendationRequest,
    PopularProductCategoriesRecommendationRequest,
    ProductCategoryRecommendationResponse,
} from '@relewise/client';
import { createContext } from '@lit/context';
import { RecommendationBatchingContextValue } from '../recommendation-batching';

export type ProductCategoryRecommendationBatchingContextValue = RecommendationBatchingContextValue<
    PopularProductCategoriesRecommendationRequest,
    ProductCategoryRecommendationResponse
>;

export type ContentCategoryRecommendationBatchingContextValue = RecommendationBatchingContextValue<
    PopularContentCategoriesRecommendationRequest,
    ContentCategoryRecommendationResponse
>;

export const productCategoryRecommendationBatchingContext =
    createContext<ProductCategoryRecommendationBatchingContextValue>(Symbol('product-category-recommendation-batching'));

export const contentCategoryRecommendationBatchingContext =
    createContext<ContentCategoryRecommendationBatchingContextValue>(Symbol('content-category-recommendation-batching'));
