import { FilterBuilder, ProductCategoryResult, ProductResult } from '@relewise/client';
import { nothing, TemplateResult } from 'lit';
import { FilterIcon, ProductTile, SearchIcon, SortIcon, XIcon } from './components';
import { Button } from './components/button';
import { LoadingSpinner } from './components/loading-spinner';
import { ContextSettings, TemplateExtensions } from './initialize';
import { PopularProducts, ProductsViewedAfterViewingProduct, PurchasedWithMultipleProducts, PurchasedWithProduct, PersonalProducts, RecentlyViewedProducts } from './recommendations';
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
import { RecommendationBatcher } from './recommendations/product-recommendation-batcher';
import { RelewiseFacetBuilder } from './facetBuilder';
import { ArrowUpIcon } from './components/icons/arrow-up-icon';
import { TargetedSearchConfiguration } from './targetedSearchConfigurations';
import { getRelewiseRecommendationTargetedConfigurations, getRelewiseSearchTargetedConfigurations } from './helpers';
import { TargetedRecommendationConfiguration } from './targetedRecommendationConfigurations';
import { ProductSearchOverlayProductCategory } from './search/components/product-search-overlay-product-category';

export interface RelewiseUISearchOptions {
    filters?: SearchFilters;
    templates?: SearchTemplates;
    facets?: SearchFacets;
    localization?: SearchLocalization;
    rememberScrollPosition?: boolean;
    debounceTimeInMs?: number;
    explodedVariants?: number;
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
    overlay?: {
        title?: {
            products?: string;
            productCategories?: string;
        };
    };
}

export interface SortingLocalization {
    sortBy?: string;
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
    showAllResults?: string;
    result?: string;
    results?: string;
}

export interface SearchFilters {
    product?: (builder: FilterBuilder) => void
    productCategory?: (builder: FilterBuilder) => void
}

export interface SearchFacets {
    product?: (builder: RelewiseFacetBuilder) => void;
}

export interface SearchTemplates {
    searchOverlayProductResult?: (product: ProductResult, extensions: TemplateExtensions) => TemplateResult<1> | typeof nothing | Promise<TemplateResult<1> | typeof nothing>;
    searchOverlayProductCategoryResult?: (productCategory: ProductCategoryResult, extensions: TemplateExtensions) => TemplateResult<1> | typeof nothing | Promise<TemplateResult<1> | typeof nothing>;
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

    registerSearchTarget(target: string, configuration: TargetedSearchConfiguration): App {
        registerSearchTarget(target, configuration);
        return this;
    }

    registerRecommendationTarget(target: string, configuration: TargetedRecommendationConfiguration): App {
        registerRecommendationTarget(target, configuration);
        return this;
    }
}

export function useRecommendations() {
    tryRegisterElement('relewise-product-recommendation-batcher', RecommendationBatcher);
    tryRegisterElement('relewise-popular-products', PopularProducts);
    tryRegisterElement('relewise-products-viewed-after-viewing-product', ProductsViewedAfterViewingProduct);
    tryRegisterElement('relewise-purchased-with-product', PurchasedWithProduct);
    tryRegisterElement('relewise-purchased-with-multiple-products', PurchasedWithMultipleProducts);
    tryRegisterElement('relewise-personal-products', PersonalProducts);
    tryRegisterElement('relewise-recently-viewed-products', RecentlyViewedProducts);

    registerGenericComponents();
}

export function useBehavioralTracking() {
    tryRegisterElement('relewise-track-product-view', ProductView);
    tryRegisterElement('relewise-track-product-category-view', ProductCategoryView);
    tryRegisterElement('relewise-track-content-view', ContentView);
    tryRegisterElement('relewise-track-content-category-view', ContentCategoryView);
    tryRegisterElement('relewise-track-brand-view', BrandView);
}

export function registerSearchTarget(target: string, configuration: TargetedSearchConfiguration) {
    const targetedConfigurations = getRelewiseSearchTargetedConfigurations();
    targetedConfigurations.add({
        target: target,
        configuration: configuration,
    });
}

export function registerRecommendationTarget(target: string, configuration: TargetedRecommendationConfiguration) {
    const targetedConfigurations = getRelewiseRecommendationTargetedConfigurations();
    targetedConfigurations.add({
        target: target,
        configuration: configuration,
    });
}

export function useSearch(options?: RelewiseUISearchOptions) {
    const defaultDebounceTimeInMs = 250;
    if (options) {
        options.debounceTimeInMs = options.debounceTimeInMs ?? defaultDebounceTimeInMs;
        window.relewiseUISearchOptions = options;
    } else {
        window.relewiseUISearchOptions = { debounceTimeInMs: defaultDebounceTimeInMs };
    }

    tryRegisterElement('relewise-product-search-overlay', ProductSearchOverlay);
    tryRegisterElement('relewise-product-search', ProductSearch);
    tryRegisterElement('relewise-search-bar', SearchBar);
    tryRegisterElement('relewise-product-search-bar', ProductSearchBar);
    tryRegisterElement('relewise-product-search-overlay-product', ProductSearchOverlayProduct);
    tryRegisterElement('relewise-product-search-overlay-product-category', ProductSearchOverlayProductCategory);
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
    tryRegisterElement('relewise-arrow-up-icon', ArrowUpIcon);
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