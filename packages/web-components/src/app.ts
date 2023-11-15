import { FacetBuilder, FilterBuilder, ProductResult } from '@relewise/client';
import { TemplateResult } from 'lit';
import { FilterIcon, ProductTile, SearchIcon, SortIcon, XIcon } from './components';
import { Button } from './components/button';
import { LoadingSpinner } from './components/loading-spinner';
import { ContextSettings, TemplateExtensions } from './initialize';
import { PopularProducts, ProductsViewedAfterViewingProduct, PurchasedWithProduct } from './recommendations';
import { ProductSearchOverlayProduct, ProductSearchOverlayResults, SearchBar } from './search';
import { ChecklistBooleanValueFacet } from './search/components/facets/checklist-boolean-value-facet';
import { ChecklistNumberValueFacet } from './search/components/facets/checklist-number-value-facet';
import { ChecklistObjectValueFacet } from './search/components/facets/checklist-object-value-facet';
import { ChecklistRangesObjectValueFacet } from './search/components/facets/checklist-ranges-object-value-facet';
import { ChecklistStringValueFacet } from './search/components/facets/checklist-string-value-facet';
import { Facets } from './search/components/facets/facets';
import { NumberRangeFacet } from './search/components/facets/number-range-facet';
import { ProductSearchBar } from './search/components/product-search-bar';
import { LoadMoreProducts } from './search/components/product-search-load-more-button';
import { ProductSearchResults } from './search/components/product-search-results';
import { ProductSearchSorting } from './search/components/product-search-sorting';
import { ProductSearch } from './search/product-search';
import { ProductSearchOverlay } from './search/product-search-overlay';
import { BrandView, ContentCategoryView, ContentView, ProductCategoryView, ProductView } from './tracking';
import { updateContextSettings } from './updateContextSettings';

export interface RelewiseUISearchOptions {
    filters?: SearchFilters;
    templates?: SearchTemplates;
    facets?: SearchFacets;
    localization?: SearchLocalization;
    rememberScrollPosition?: boolean;
    debounceTimeInMs?: number;
}

export class RelewiseFacetBuilder {
    builder: FacetBuilder;
    private labels: string[] = [];

    constructor(builder: FacetBuilder) {
        this.builder = builder;
    }

    addFacet(facet: (builder: FacetBuilder) => void, options: { heading: string }): this {
        this.labels.push(options.heading);

        facet(this.builder);
        return this;
    }

    getLabels(): string[] {
        return this.labels;
    }
}

export interface SearchLocalization {
    searchBar?: SearchBarLocalization;
    sortingButton?: SortingLocalization;
    loadMoreButton?: LoadMoreLocalization;
    facets?: FacetLocalization;
    searchResults?: SearchResultLocalization;
}

export interface SearchBarLocalization {
    search?: string;
    placeholder?: string;
}

export interface SortingLocalization {
    sorting?: string;
    relevance?: string;
    salesPriceAscending?: string;
    salesPriceDescending?: string;
    alphabeticalAscending?: string;
    alphabeticalDescending?: string;
}

export interface LoadMoreLocalization {
    loadMore?: string;
    showing?: string;
    outOf?: string;
    products?: string;
}

export interface FacetLocalization {
    save?: string;
    showMore?: string;
    showLess?: string;
    filter?: string;
    yes?: string;
    no?: string;
}

export interface SearchResultLocalization {
    noResults?: string;
}

export interface SearchFilters {
    product?: (builder: FilterBuilder) => void
}

export interface SearchFacets {
    product?: (builder: RelewiseFacetBuilder) => void;
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
        options.debounceTimeInMs = options.debounceTimeInMs ?? 250;
        window.relewiseUISearchOptions = options;
    }

    tryRegisterElement('relewise-product-search-overlay', ProductSearchOverlay);
    tryRegisterElement('relewise-product-search', ProductSearch);
    tryRegisterElement('relewise-search-bar', SearchBar);
    tryRegisterElement('relewise-product-search-bar', ProductSearchBar);
    tryRegisterElement('relewise-product-search-overlay-product', ProductSearchOverlayProduct);
    tryRegisterElement('relewise-product-search-overlay-results', ProductSearchOverlayResults);
    tryRegisterElement('relewise-checklist-string-value-facet', ChecklistStringValueFacet);
    tryRegisterElement('relewise-checklist-boolean-value-facet', ChecklistBooleanValueFacet);
    tryRegisterElement('relewise-checklist-object-value-facet', ChecklistObjectValueFacet);
    tryRegisterElement('relewise-checklist-ranges-object-value-facet', ChecklistRangesObjectValueFacet);
    tryRegisterElement('relewise-checklist-number-value-facet', ChecklistNumberValueFacet);
    tryRegisterElement('relewise-number-range-facet', NumberRangeFacet);
    tryRegisterElement('relewise-facets', Facets);
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
    tryRegisterElement('relewise-loading-spinner', LoadingSpinner);
}

function tryRegisterElement(name: string, constructor: CustomElementConstructor) {
    if (customElements.get(name) === undefined) {
        customElements.define(name, constructor);
    }
}