import { ProductResult, ProductSettingsRecommendationBuilder, RelewiseClientOptions, SelectedProductPropertiesSettings, Settings, User, UserFactory } from '@relewise/client';
import { TemplateResult } from 'lit';

export interface RelewiseUIOptions {
    datasetId: string;
    apiKey: string;
    contextSettings: ContextSettings;
    selectedPropertiesSettings?: {
        product?: Partial<SelectedProductPropertiesSettings>;
    };
    clientOptions?: RelewiseClientOptions;
    templates?: Templates;
}

interface ContextSettings {
    getUser: (userFactory: UserFactory) => User;
    language: string;
    currency: string;
    displayedAtLocation: string;
}

interface TemplateExtensions {
    html: (strings: TemplateStringsArray, ...values: unknown[]) => TemplateResult<1>;
    helpers: {
        formatPrice: (price: string | number | null | undefined) => string | number | null | undefined;
    }
}

interface Templates {
    product?: (product: ProductResult, extensions: TemplateExtensions) => TemplateResult<1>;
}


export function getRelewiseUIOptions(): RelewiseUIOptions {
    const options = window.relewiseUIOptions;

    if (!options ||
        !options.datasetId ||
        !options.apiKey ||
        !options.contextSettings) {
        throw new Error('Relewise UI not correctly configured');
    }

    return options;
}

export function getRelewiseContextSettings(): Settings {
    const contextSettings = getRelewiseUIOptions().contextSettings;

    return {
        currency: contextSettings.currency,
        displayedAtLocation: contextSettings.displayedAtLocation,
        language: contextSettings.language,
        user: contextSettings.getUser(UserFactory),
    }
}

export function getProductRecommendationBuilderWithDefaults<T extends ProductSettingsRecommendationBuilder>(createBuilder: (settings: Settings) => T): T {
    const settings = getRelewiseContextSettings();
    const defaultProductProperties: Partial<SelectedProductPropertiesSettings> = {
        displayName: true,
        pricing: true,
        dataKeys: ['ImageUrl', 'Url'],
    };

    return createBuilder(settings)
        .setSelectedProductProperties(getRelewiseUIOptions().selectedPropertiesSettings?.product ?? defaultProductProperties);
}