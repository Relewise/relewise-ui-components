import { ProductResult, ProductSettingsRecommendationBuilder, RelewiseClientOptions, SelectedProductPropertiesSettings, Settings, User, UserFactory } from '@relewise/client';
import { TemplateResult } from 'lit';
import { PopularProducts } from '.';
import { ProductsViewedAfterViewingProduct } from './recommendationElements/products-viewed-after-viewing-product';
import { PurchasedWithProduct } from './recommendationElements/purchased-with-product';

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

interface RelewiseUISettings {
    datasetId: string;
    apiKey: string;
    contextSettings: ContextSettings;
    selectedPropertiesSettings?: {
        product?: Partial<SelectedProductPropertiesSettings>;
    };
    clientOptions?: RelewiseClientOptions;
    templates?: Templates;
}


export function initializeRelewiseUI(settings: RelewiseUISettings) {
    window.relewiseUISettings = settings;

    tryRegisterElement('relewise-popular-products', PopularProducts);
    tryRegisterElement('relewise-products-viewed-after-viewing-product', ProductsViewedAfterViewingProduct);
    tryRegisterElement('relewise-purchased-with-product', PurchasedWithProduct);
}

function tryRegisterElement(name: string, constructor: CustomElementConstructor) {
    if (customElements.get(name) === undefined) {
        customElements.define(name, constructor);
    }
}

export function getRelewiseUISettings(): RelewiseUISettings {
    const relewiseSettingsFromWindow = window.relewiseUISettings;

    if (!relewiseSettingsFromWindow ||
        !relewiseSettingsFromWindow.datasetId ||
        !relewiseSettingsFromWindow.apiKey ||
        !relewiseSettingsFromWindow.contextSettings) {
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
    const settings = getRelewiseContextSettings();
    const defaultProductProperties: Partial<SelectedProductPropertiesSettings> = {
        displayName: true,
        pricing: true,
        dataKeys: ['ImageUrl', 'Url'],
    };

    return createBuilder(settings)
        .setSelectedProductProperties(getRelewiseUISettings().selectedPropertiesSettings?.product ?? defaultProductProperties);
}