import { ProductSettingsRecommendationBuilder, RelewiseClientOptions, SelectedProductPropertiesSettings, Settings, User, UserFactory } from '@relewise/client';
import { PopularProducts } from '.';


interface ContextSettings {
    getUser: (userFactory: UserFactory) => User
    language: string;
    currency: string;
    displayedAtLocation: string;
}

interface RelewiseUISettings {
    datasetId: string;    
    apiKey: string;
    contextSettings: ContextSettings;
    selectedPropertiesSettings?: {
        product?: Partial<SelectedProductPropertiesSettings>;
    };
    clientOptions?: RelewiseClientOptions;
}

export function initializeRelewiseUI(
    {
        datasetId,
        apiKey,
        contextSettings,
        selectedPropertiesSettings,
        clientOptions,
    }: RelewiseUISettings ) {
        
    window.relewiseUISettings = {
        datasetId: datasetId,
        apiKey: apiKey,
        contextSettings: contextSettings,
        selectedPropertiesSettings: selectedPropertiesSettings,
        clientOptions: clientOptions,
    }

    if (customElements.get('relewise-popular-products') === undefined) {
        customElements.define('relewise-popular-products', PopularProducts);
    }
}

export function getRelewiseUISettings(): RelewiseUISettings {
    const relewiseSettingsFromWindow  = window.relewiseUISettings;

    if(!relewiseSettingsFromWindow ||
        !relewiseSettingsFromWindow.datasetId ||
        !relewiseSettingsFromWindow.apiKey ||
        !relewiseSettingsFromWindow.contextSettings ) {
        throw new Error('Relewise UI not correctly configured');
    }

    return relewiseSettingsFromWindow;
}

export function getRelewiseContextSettings(): Settings {
    const contextSettings = getRelewiseUISettings().contextSettings;

    return {
        currency: contextSettings.currency,
        displayedAtLocation: contextSettings.displayedAtLocation,
        language: contextSettings.language,
        user: contextSettings.getUser(UserFactory),
    }
}

export function getProductRecommendationBuilderWithDefaults<T extends ProductSettingsRecommendationBuilder>(createBuilder: (settings: Settings) => T): T {
    const settingsFromContext = getRelewiseContextSettings();
    const builder = createBuilder(settingsFromContext);

    builder.setSelectedProductProperties(
        getRelewiseUISettings().selectedPropertiesSettings?.product ?? {
            displayName: true,
        },
    );

    return builder;
}