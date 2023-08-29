import { RelewiseClientOptions, SelectedProductPropertiesSettings, Settings, User, UserFactory } from '@relewise/client';


interface ContextSettings {
    getUser: (userFactory: UserFactory) => User
    language: string;
    currency: string;
    displayedAtLocation: string;
}

interface RelewiseSettings {
    datasetId: string;    
    apiKey: string;
    contextSettings: ContextSettings;
    selectedProductPropertiesSettings: SelectedProductPropertiesSettings;
    clientOptions?: RelewiseClientOptions;
}

export function initRelewiseUI(
    {
        datasetId,
        apiKey,
        contextSettings,
        selectedProductPropertiesSettings,
        clientOptions,
    }: RelewiseSettings ) {
    window.relewiseSettings = {
        datasetId: datasetId,
        apiKey: apiKey,
        contextSettings: contextSettings,
        selectedProductPropertiesSettings: selectedProductPropertiesSettings,
        clientOptions: clientOptions,
    }

    const event = new Event('relewise-ui-initialized');
    const elements = document.querySelectorAll('*');
    elements.forEach((element) => {
        if(element.tagName.toLowerCase().startsWith('relewise-')) {
            element.dispatchEvent(event);
        }
    }) 
}

export function getRelewiseSettings(): RelewiseSettings {
    const relewiseSettingsFromWindow  = window.relewiseSettings;

    if(!relewiseSettingsFromWindow ||
        !relewiseSettingsFromWindow.datasetId ||
        !relewiseSettingsFromWindow.apiKey ||
        !relewiseSettingsFromWindow.contextSettings ||
        !relewiseSettingsFromWindow.selectedProductPropertiesSettings ) {
        throw new Error('Relewise UI not correctly configured')
    }

    return {
        datasetId: relewiseSettingsFromWindow.datasetId,
        apiKey: relewiseSettingsFromWindow.apiKey,
        contextSettings: relewiseSettingsFromWindow.contextSettings,
        selectedProductPropertiesSettings: relewiseSettingsFromWindow.selectedProductPropertiesSettings,
        clientOptions: relewiseSettingsFromWindow.clientOptions,
    }
}

export function getRelewiseBuilderSettings(): Settings {
    const contextSettings = getRelewiseSettings().contextSettings;

    return {
        currency: contextSettings.currency,
        displayedAtLocation: contextSettings.displayedAtLocation,
        language: contextSettings.language,
        user: contextSettings.getUser(UserFactory),
    }
}