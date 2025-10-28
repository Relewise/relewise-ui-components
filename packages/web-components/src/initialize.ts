import { ContentResult, FilterBuilder, ProductResult, RelevanceModifierBuilder, RelewiseClientOptions, SelectedContentPropertiesSettings, SelectedProductCategoryPropertiesSettings, SelectedProductPropertiesSettings, SelectedVariantPropertiesSettings, User } from '@relewise/client';
import { nothing, TemplateResult } from 'lit';
import { App, RelewiseUISearchOptions } from './app';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { stripHtml } from './helpers/templateHelpers';
import { TargetedSearchConfigurations } from './targetedSearchConfigurations';
import { TargetedRecommendationConfigurations } from './targetedRecommendationConfigurations';

export interface RelewiseUIOptions {
    datasetId: string;
    apiKey: string;
    contextSettings: ContextSettings;
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
    getUser: () => User;
    language: string;
    currency: string;
}

export interface ProductTemplateExtensions {
    html: (strings: TemplateStringsArray, ...values: unknown[]) => TemplateResult<1>;
    helpers: {
        formatPrice: (price: string | number | null | undefined) => string | number | null | undefined;
        unsafeHTML: typeof unsafeHTML;
        nothing: typeof nothing;
        stripHtml: typeof stripHtml;
    };
}

export interface ContentTemplateExtensions {
    html: (strings: TemplateStringsArray, ...values: unknown[]) => TemplateResult<1>;
    helpers: {
        unsafeHTML: typeof unsafeHTML;
        nothing: typeof nothing;
        stripHtml: typeof stripHtml;
    };
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