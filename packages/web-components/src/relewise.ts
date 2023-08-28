import { RelewiseClientOptions, SelectedProductPropertiesSettings, Settings, User, UserFactory } from '@relewise/client';
import { PopularProducts } from '.';

interface RelewiseSettings {
    getUser: (userFactory: UserFactory) => User
    datasetId: string;    
    apiKey: string;
    language: string;
    currency: string;
    displayedAtLocation: string;
    selectedProductPropertiesSettings: SelectedProductPropertiesSettings;
    clientOptions?: RelewiseClientOptions;
}

export function relewise(
    {
        getUser,
        datasetId,
        apiKey,
        language,
        currency,
        displayedAtLocation,
        selectedProductPropertiesSettings,
        clientOptions,
    }: RelewiseSettings ) {
    const user = getUser(UserFactory)
    
    const settings = {
        currency: currency,
        language: language,
        displayedAtLocation: displayedAtLocation,
        user: user,
    } as Settings

    window.relewiseSettings = { 
        datasetId: datasetId,
        apiKey: apiKey,
        settings: settings,
        selectedProductPropertiesSettings: selectedProductPropertiesSettings,
        clientOptions: clientOptions,
    }

    if (customElements.get('popular-products') === undefined) {
        customElements.define('popular-products', PopularProducts);
    }
}