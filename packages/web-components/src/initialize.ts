import { FilterBuilder, ProductResult, RelewiseClientOptions, SelectedProductPropertiesSettings, User } from '@relewise/client';
import { TemplateResult } from 'lit';
import { App, RelewiseUISearchOptions } from './app';

export interface RelewiseUIOptions {
    datasetId: string;
    apiKey: string;
    contextSettings: ContextSettings;
    selectedPropertiesSettings?: {
        product?: Partial<SelectedProductPropertiesSettings>;
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
    window.relewiseUIOptions = options;

    return new App();
}

declare global {
    interface Window {
        relewiseUIOptions: RelewiseUIOptions;
        relewiseUISearchOptions: RelewiseUISearchOptions;
    }
}