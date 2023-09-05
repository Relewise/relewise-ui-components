import { FilterBuilder, ProductResult, ProductSettingsRecommendationBuilder, RelewiseClientOptions, SelectedProductPropertiesSettings, Settings, User, UserFactory } from '@relewise/client';
import { TemplateResult } from 'lit';
import { PopularProducts } from './recommendations/products/popular-products';
import { ProductsViewedAfterViewingProduct } from './recommendations/products/products-viewed-after-viewing-product';
import { PurchasedWithProduct } from './recommendations/products/purchased-with-product';
import { defaultProductProperties } from './defaultProductProperties';

export interface RelewiseUIOptions {
    datasetId: string;
    apiKey: string;
    contextSettings: ContextSettings;
    selectedPropertiesSettings?: {
        product?: Partial<SelectedProductPropertiesSettings>;
    };
    clientOptions?: RelewiseClientOptions;
    templates?: Templates;
    filters?: Filters;
}

interface Filters {
    product?: (builder: FilterBuilder) => void
}

export interface ContextSettings {
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

export function initializeRelewiseUI(options: RelewiseUIOptions) {
    window.relewiseUIOptions = options;
    
    tryRegisterElement('relewise-popular-products', PopularProducts);
    tryRegisterElement('relewise-products-viewed-after-viewing-product', ProductsViewedAfterViewingProduct);
    tryRegisterElement('relewise-purchased-with-product', PurchasedWithProduct);
}

function tryRegisterElement(name: string, constructor: CustomElementConstructor) {
    if (customElements.get(name) === undefined) {
        customElements.define(name, constructor);
    }
}

declare global {
    interface Window {
        relewiseUIOptions: RelewiseUIOptions;
    }
  }