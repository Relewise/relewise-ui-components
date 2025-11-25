import { ContentResult, FilterBuilder, ProductResult, RelevanceModifierBuilder, RelewiseClientOptions, SelectedContentPropertiesSettings, SelectedProductCategoryPropertiesSettings, SelectedProductPropertiesSettings, SelectedVariantPropertiesSettings, User } from '@relewise/client';
import { nothing, TemplateResult } from 'lit';
import { App, RelewiseUISearchOptions } from './app';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { TemplateHelpers } from './helpers/templateHelpers';
import { TargetedSearchConfigurations } from './targetedSearchConfigurations';
import { TargetedRecommendationConfigurations } from './targetedRecommendationConfigurations';

export interface UserEngagementEntityOptions {
    sentiment?: boolean;
    favorite?: boolean;
}

export interface UserEngagementOptions {
    product?: UserEngagementEntityOptions;
    content?: UserEngagementEntityOptions;
}

export interface FavoriteButtonLocalization {
    addToFavorites?: string;
    removeFavorite?: string;
}

export interface SentimentButtonsLocalization {
    like?: string;
    removeLike?: string;
    dislike?: string;
    removeDislike?: string;
}

export type RelewiseUILocalization = {
    favoriteButton?: FavoriteButtonLocalization;
    sentimentButtons?: SentimentButtonsLocalization;
};

export interface RelewiseUIOptions {
    datasetId: string;
    apiKey: string;
    contextSettings: ContextSettings;
    localization?: RelewiseUILocalization;
    selectedPropertiesSettings?: {
        product?: Partial<SelectedProductPropertiesSettings>;
        variant?: Partial<SelectedVariantPropertiesSettings>;
        productCategory?: Partial<SelectedProductCategoryPropertiesSettings>;
        content?: Partial<SelectedContentPropertiesSettings>;
    };
    clientOptions: RelewiseClientOptions;
    templates?: Templates;
    filters?: Filters;
    relevanceModifiers?: RelevanceModifiers;
    targets?: Targets;
    userEngagement?: UserEngagementOptions;
}

export interface Filters {
    product?: (builder: FilterBuilder) => void;
    productCategory?: (builder: FilterBuilder) => void;
    content?: (builder: FilterBuilder) => void;
}

export interface RelevanceModifiers {
    product?: (builder: RelevanceModifierBuilder) => void;
    productCategory?: (builder: RelevanceModifierBuilder) => void;
    content?: (builder: RelevanceModifierBuilder) => void;
}

export interface ContextSettings {
    getUser: () => Promise<User> | User;
    language: string;
    currency: string;
}

export type CommonTemplateHelpers = TemplateHelpers & {
    unsafeHTML: typeof unsafeHTML;
    nothing: typeof nothing;
};

export interface ProductTemplateExtensions {
    html: (strings: TemplateStringsArray, ...values: unknown[]) => TemplateResult<1>;
    helpers: CommonTemplateHelpers & {
        formatPrice: (price: string | number | null | undefined) => string | number | null | undefined;
    };
}

export interface ContentTemplateExtensions {
    html: (strings: TemplateStringsArray, ...values: unknown[]) => TemplateResult<1>;
    helpers: CommonTemplateHelpers;
}

export interface Templates {
    product?: (product: ProductResult, extensions: ProductTemplateExtensions) => TemplateResult<1> | typeof nothing | Promise<TemplateResult<1> | typeof nothing>;
    content?: (content: ContentResult, extensions: ContentTemplateExtensions) => TemplateResult<1> | typeof nothing | Promise<TemplateResult<1> | typeof nothing>;
}

export interface Targets {
    searchTargets?: (builder: TargetedSearchConfigurations) => void;
    recommendationTargets?: (builder: TargetedRecommendationConfigurations) => void;
}

export function initializeRelewiseUI(options: RelewiseUIOptions): App {
    window.relewiseUIOptions = options;
    window.relewiseUISearchTargetedConfigurations = new TargetedSearchConfigurations(options.targets?.searchTargets);
    window.relewiseUIRecommendationTargetedConfigurations = new TargetedRecommendationConfigurations(options.targets?.recommendationTargets);
    return new App();
}

declare global {
    interface Window {
        relewiseUIOptions: RelewiseUIOptions;
        relewiseUISearchOptions: RelewiseUISearchOptions;
        relewiseUISearchTargetedConfigurations: TargetedSearchConfigurations;
        relewiseUIRecommendationTargetedConfigurations: TargetedRecommendationConfigurations;
    }
}
