import type { FeedRecommendationInitializationBuilder } from '@relewise/client';

export interface AdaptiveDiscoveryFeedConfiguration {
    minimumPageSize: number;
    configurationKey?: string;
    configure: (builder: FeedRecommendationInitializationBuilder) => void;
}
