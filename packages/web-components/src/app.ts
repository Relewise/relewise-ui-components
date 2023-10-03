import { FilterBuilder, ProductResult } from '@relewise/client';
import { TemplateResult } from 'lit';
import { ContextSettings, TemplateExtensions } from './initialize';
import { PopularProducts, ProductsViewedAfterViewingProduct, PurchasedWithProduct } from './recommendations';
import { SearchOverlay } from './search/search-overlay';
import { BrandView, ContentCategoryView, ContentView, ProductCategoryView, ProductView } from './tracking';
import { updateContextSettings } from './updateContextSettings';
import { ProductSearchBarResultOverlay, SearchBar, SearchOverlayProductResult } from './search';
import { ProductTile } from './components';

export interface RelewiseUISearchOptions {
    filters?: SearchFilters;
    templates?: SearchTemplates;
}

export interface SearchFilters {
    search?: (builder: FilterBuilder) => void
}

export interface SearchTemplates {
    searchOverlayProductResult?: (product: ProductResult, extensions: TemplateExtensions) => TemplateResult<1>;
}

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

    useSearch(options?: RelewiseUISearchOptions): App {
        useSearch(options);
        return this;
    }
}

export function useRecommendations() {
    tryRegisterElement('relewise-popular-products', PopularProducts);
    tryRegisterElement('relewise-products-viewed-after-viewing-product', ProductsViewedAfterViewingProduct);
    tryRegisterElement('relewise-purchased-with-product', PurchasedWithProduct);
    tryRegisterElement('relewise-product-tile', ProductTile);
}

export function useBehavioralTracking() {
    tryRegisterElement('relewise-track-product-view', ProductView);
    tryRegisterElement('relewise-track-product-category-view', ProductCategoryView);
    tryRegisterElement('relewise-track-content-view', ContentView);
    tryRegisterElement('relewise-track-content-category-view', ContentCategoryView);
    tryRegisterElement('relewise-track-brand-view', BrandView);
} 

export function useSearch(options?: RelewiseUISearchOptions) {
    if (options) {
        window.relewiseUISearchOptions = options;
    }

    tryRegisterElement('relewise-search-overlay', SearchOverlay);
    tryRegisterElement('relewise-search-bar', SearchBar);
    tryRegisterElement('relewise-search-result-overlay-product', SearchOverlayProductResult);
    tryRegisterElement('relewise-search-result-overlay', ProductSearchBarResultOverlay);
} 

function tryRegisterElement(name: string, constructor: CustomElementConstructor) {
    if (customElements.get(name) === undefined) {
        customElements.define(name, constructor);
    }
}