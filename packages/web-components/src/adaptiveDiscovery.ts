import type {
    ContentResult,
    FeedCompositionResult,
    FeedRecommendationInitializationBuilder,
    ProductResult,
} from '@relewise/client';
import { nothing, TemplateResult } from 'lit';
import type { ref } from 'lit/directives/ref.js';
import type { CommonTemplateHelpers } from './initialize';

export interface AdaptiveDiscoveryCompositionTemplateExtensions {
    html: (strings: TemplateStringsArray, ...values: unknown[]) => TemplateResult<1>;
    helpers: CommonTemplateHelpers & {
        formatPrice: (price: string | number | null | undefined) => string | number | null | undefined;
        trackProductClick: (product: ProductResult) => void;
        trackContentClick: (content: ContentResult) => void;
        trackProductVisibility: (product: ProductResult) => ReturnType<typeof ref>;
        trackContentVisibility: (content: ContentResult) => ReturnType<typeof ref>;
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
    dwellThresholdMilliseconds?: number;
    configure: (builder: FeedRecommendationInitializationBuilder) => void;
    compositionTemplates?: Record<string, AdaptiveDiscoveryCompositionTemplate>;
}
