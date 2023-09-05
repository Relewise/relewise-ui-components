import { FilterBuilder, ProductResult, ProductSettingsRecommendationBuilder, RelewiseClientOptions, SelectedProductPropertiesSettings, Settings, User, UserFactory } from '@relewise/client';
import { TemplateResult } from 'lit';
import { PopularProducts } from './recommendations/products/popular-products';
import { ProductsViewedAfterViewingProduct } from './recommendations/products/products-viewed-after-viewing-product';
import { PurchasedWithProduct } from './recommendations/products/purchased-with-product';
import { RelewiseUIOptions } from './relewiseUIOptions';

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