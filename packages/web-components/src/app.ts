import { ContextSettings } from './initialize';
import { PopularProducts, ProductsViewedAfterViewingProduct, PurchasedWithProduct } from './recommendations';
import { Autocomplete } from './search/autocomplete';
import { ProductView, ProductCategoryView, ContentView, ContentCategoryView, BrandView } from './tracking';
import { updateContextSettings } from './updateContextSettings';

export class App {
    useRecommendations(): App {
        useRecommendations();
        return this;
    }
    
    useBehavioralTracking(): App {
        useBehavioralTracking();
        return this;
    }
    
    updateContextSettings(contextSettings: Partial<ContextSettings>): App {
        updateContextSettings(contextSettings);
        return this;
    }

    useSearch(): App {
        useSearch();
        return this;
    }
}

export function useRecommendations() {
    tryRegisterElement('relewise-popular-products', PopularProducts);
    tryRegisterElement('relewise-products-viewed-after-viewing-product', ProductsViewedAfterViewingProduct);
    tryRegisterElement('relewise-purchased-with-product', PurchasedWithProduct);
}

export function useBehavioralTracking() {
    tryRegisterElement('relewise-track-product-view', ProductView);
    tryRegisterElement('relewise-track-product-category-view', ProductCategoryView);
    tryRegisterElement('relewise-track-content-view', ContentView);
    tryRegisterElement('relewise-track-content-category-view', ContentCategoryView);
    tryRegisterElement('relewise-track-brand-view', BrandView);
} 

export function useSearch() {
    tryRegisterElement('relewise-autocomplete', Autocomplete);
} 

function tryRegisterElement(name: string, constructor: CustomElementConstructor) {
    if (customElements.get(name) === undefined) {
        customElements.define(name, constructor);
    }
}