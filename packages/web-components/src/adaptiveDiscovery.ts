import type { FeedRecommendationInitializationBuilder } from '@relewise/client';

export interface AdaptiveDiscoveryFeedConfiguration {
    minimumPageSize: number;
    configurationKey?: string;
    maximumItems?: number;
    configure: (builder: FeedRecommendationInitializationBuilder) => void;
}
