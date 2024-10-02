import { FilterBuilder, ProductResult, RelewiseClientOptions, SelectedProductPropertiesSettings, SelectedVariantPropertiesSettings, User } from '@relewise/client';
import { TemplateResult } from 'lit';
import { App, RelewiseUISearchOptions } from './app';
import { setOptions } from './helpers';

export interface RelewiseUIOptions {
    datasetId: string;
    apiKey: string;
    contextSettings: ContextSettings;
    selectedPropertiesSettings?: {
        product?: Partial<SelectedProductPropertiesSettings>;
        variant?: Partial<SelectedVariantPropertiesSettings>;
    };
    clientOptions: RelewiseClientOptions;
    templates?: Templates;
    filters?: Filters;
}

export interface Filters {
    product?: (builder: FilterBuilder) => void
}

export interface ContextSettings {
    getUser: () => User;
    language: string;
    currency: string;
}

export interface TemplateExtensions {
    html: (strings: TemplateStringsArray, ...values: unknown[]) => TemplateResult<1>;
    helpers: {
        formatPrice: (price: string | number | null | undefined) => string | number | null | undefined;
    }
}

export interface Templates {
    product?: (product: ProductResult, extensions: TemplateExtensions) => TemplateResult<1>;
}

export function initializeRelewiseUI(options: RelewiseUIOptions): App {
    setOptions(options);

    return new App();
}

declare global {
    interface Window {
        relewiseUIOptions: RelewiseUIOptions;
        relewiseUISearchOptions: RelewiseUISearchOptions;
    }
}