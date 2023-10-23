import { FacetBuilder, FilterBuilder, ProductResult } from '@relewise/client';
import { TemplateResult } from 'lit';
import { FilterIcon, ProductTile, SearchIcon, XIcon } from './components';
import { Button } from './components/button';
import { SortIcon } from './components/icons/sort-icon';
import { ContextSettings, TemplateExtensions } from './initialize';
import { PopularProducts, ProductsViewedAfterViewingProduct, PurchasedWithProduct } from './recommendations';
import { ProductSearchOverlayProduct, ProductSearchOverlayResults, SearchBar } from './search';
import { LoadMoreProducts } from './search/components/product-search-load-more-button';
import { ProductSearchResults } from './search/components/product-search-results';
import { ProductSearchSorting } from './search/components/product-search-sorting';
import { ProductSearch } from './search/product-search';
import { ProductSearchOverlay } from './search/product-search-overlay';
import { BrandView, ContentCategoryView, ContentView, ProductCategoryView, ProductView } from './tracking';
import { updateContextSettings } from './updateContextSettings';
import { ChecklistFacet } from './search/components/facets';

export interface RelewiseUISearchOptions {
    filters?: SearchFilters;
    templates?: SearchTemplates;
    facets?: SearchFacets;
}

export interface SearchFacets {
    facetBuilder: (builder: FacetBuilder, selectedValues: string[]) => void
}

export interface SearchFilters {
    productSearch?: (builder: FilterBuilder) => void
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
    
    registerGenericComponents();
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

    tryRegisterElement('relewise-product-search-overlay', ProductSearchOverlay);
    tryRegisterElement('relewise-product-search', ProductSearch);
    tryRegisterElement('relewise-search-bar', SearchBar);
    tryRegisterElement('relewise-product-search-overlay-product', ProductSearchOverlayProduct);
    tryRegisterElement('relewise-product-search-overlay-results', ProductSearchOverlayResults);
    tryRegisterElement('relewise-checklist-facet', ChecklistFacet);
    tryRegisterElement('relewise-product-search-results', ProductSearchResults);
    tryRegisterElement('relewise-product-search-load-more-button', LoadMoreProducts);
    tryRegisterElement('relewise-product-search-sorting', ProductSearchSorting);
    registerGenericComponents();
}

function registerGenericComponents() {
    tryRegisterElement('relewise-product-tile', ProductTile);
    tryRegisterElement('relewise-search-icon', SearchIcon);
    tryRegisterElement('relewise-filter-icon', FilterIcon);
    tryRegisterElement('relewise-x-icon', XIcon);
    tryRegisterElement('relewise-sort-icon', SortIcon);
    tryRegisterElement('relewise-button', Button);
}

function tryRegisterElement(name: string, constructor: CustomElementConstructor) {
    if (customElements.get(name) === undefined) {
        customElements.define(name, constructor);
    }
}