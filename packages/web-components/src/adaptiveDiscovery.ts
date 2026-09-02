import type {
    ContentResult,
    FeedCompositionResult,
    FeedRecommendationInitializationBuilder,
    ProductResult,
} from '@relewise/client';
import { nothing, TemplateResult } from 'lit';
import type { CommonTemplateHelpers } from './initialize';

export interface AdaptiveDiscoveryCompositionTemplateExtensions {
    html: (strings: TemplateStringsArray, ...values: unknown[]) => TemplateResult<1>;
    helpers: CommonTemplateHelpers & {
        formatPrice: (price: string | number | null | undefined) => string | number | null | undefined;
        trackProductClick: (product: ProductResult) => void;
        trackContentClick: (content: ContentResult) => void;
    };
}

export type AdaptiveDiscoveryCompositionTemplate = (
    composition: FeedCompositionResult,
    extensions: AdaptiveDiscoveryCompositionTemplateExtensions,
) => TemplateResult<1> | typeof nothing | Promise<TemplateResult<1> | typeof nothing>;

export interface AdaptiveDiscoveryFeedConfiguration {
    minimumPageSize: number;
    configurationKey?: string;
    maximumItems?: number;
    configure: (builder: FeedRecommendationInitializationBuilder) => void;
    compositionTemplates?: Record<string, AdaptiveDiscoveryCompositionTemplate>;
}
