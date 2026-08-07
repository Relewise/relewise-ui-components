import type {
    ContentResult,
    ContentSearchRequest,
    ContentSearchResponse,
    ProductCategoryResult,
    ProductCategorySearchRequest,
    ProductCategorySearchResponse,
    ProductResult,
    ProductSearchRequest,
    ProductSearchResponse,
    SearchResponseCollection,
    Settings,
    User,
} from '@relewise/client';
import type { TemplateResult } from 'lit';
import type { UniversalSearchTabLocalization } from '../app';
import { getRelewiseUISearchOptions } from '../helpers';
import { buildContentSearchRequest } from './contentSearchRequestBuilder';
import { buildProductCategorySearchRequest } from './productCategorySearchRequestBuilder';
import { buildProductSearchRequest } from './productSearchRequestBuilder';
import { getSearcher } from './searcher';
import { renderUniversalSearchContentTab } from './universal-search-content-tab';
import { getUniversalSearchPageSize } from './universal-search-options';
import { renderUniversalSearchProductCategoriesTab } from './universal-search-product-categories-tab';
import { renderUniversalSearchProductsTab } from './universal-search-products-tab';
import { UniversalSearchTab, UniversalSearchTabId, universalSearchTabSettings } from './universal-search-tab-settings';
import { getNumberOfUniversalSearchResultsToFetch } from './universal-search-url-state';
import type { UniversalSearchRequest, UniversalSearchResult, UniversalSearchResultItem } from './universal-search.types';

type Searcher = ReturnType<typeof getSearcher>;
type SearchResponse = NonNullable<SearchResponseCollection['responses']>[number];

export type UniversalSearchEntityRenderOptions = {
    loading: boolean;
    user: User | null;
    target: string | null;
    onLoadMore: () => void;
    onSearchOptionsChanged: () => void;
};

export type UniversalSearchPreparedRequest = {
    request: UniversalSearchRequest;
    executeSingle: (searcher: Searcher, abortSignal: AbortSignal) => Promise<void>;
    applyBatchResponse: (response: SearchResponseCollection) => void;
};

type UniversalSearchEntityRequestOptions = {
    term: string;
    settings: Settings;
    target: string | null;
    page: number;
    pageSize: number;
    resultsLoaded: number;
    resultsToFetch: number | null;
};

type UniversalSearchEntityRequestResult<TRequest extends UniversalSearchRequest> = {
    request: TRequest;
    facetLabels: string[];
};

type UniversalSearchEntityState<TResponse extends UniversalSearchResult, TResult extends UniversalSearchResultItem> = {
    response: TResponse | null;
    results: TResult[];
    facetLabels: string[];
    error: string | null;
};

type UniversalSearchEntityDefinition<
    TRequest extends UniversalSearchRequest,
    TResponse extends UniversalSearchResult & SearchResponse,
    TResult extends UniversalSearchResultItem,
> = {
    id: UniversalSearchTab;
    responseType: string;
    defaultTabLabel: string;
    defaultError: string;
    getLocalization: () => UniversalSearchTabLocalization | undefined;
    buildRequest: (options: UniversalSearchEntityRequestOptions) => UniversalSearchEntityRequestResult<TRequest>;
    executeSingle: (searcher: Searcher, request: TRequest, abortSignal: AbortSignal) => Promise<TResponse | null | undefined>;
    getResults: (response: TResponse) => TResult[];
    render: (state: UniversalSearchEntityState<TResponse, TResult>, options: UniversalSearchEntityRenderOptions) => TemplateResult;
};

export interface UniversalSearchEntity {
    readonly id: UniversalSearchTab;
    readonly response: UniversalSearchResult | null;
    readonly results: UniversalSearchResultItem[];
    readonly page: number;
    readonly pageSize: number;
    readonly facetLabels: string[];
    readonly error: string | null;
    readonly tabLabel: string;
    readonly resultsForLabel: string;
    prepareRequest(term: string, settings: Settings, target: string | null): UniversalSearchPreparedRequest;
    resetForSearch(): void;
    clear(): void;
    clearError(): void;
    setError(): void;
    setPage(page: number): void;
    render(options: UniversalSearchEntityRenderOptions): TemplateResult;
}

class TypedUniversalSearchEntity<
    TRequest extends UniversalSearchRequest,
    TResponse extends UniversalSearchResult & SearchResponse,
    TResult extends UniversalSearchResultItem,
> implements UniversalSearchEntity {
    response: TResponse | null = null;
    results: TResult[] = [];
    page = 1;
    facetLabels: string[] = [];
    error: string | null = null;

    constructor(
        private readonly definition: UniversalSearchEntityDefinition<TRequest, TResponse, TResult>,
        private readonly defaultPageSize: number,
        private readonly stateChanged: () => void,
    ) { }

    get id(): UniversalSearchTab {
        return this.definition.id;
    }

    get pageSize(): number {
        return getUniversalSearchPageSize(this.id, this.defaultPageSize);
    }

    private get resultsToFetch(): number | null {
        return getNumberOfUniversalSearchResultsToFetch(this.id);
    }

    get tabLabel(): string {
        return this.definition.getLocalization()?.tab ?? this.definition.defaultTabLabel;
    }

    get resultsForLabel(): string {
        return this.definition.getLocalization()?.resultsFor ?? 'Search results for';
    }

    prepareRequest(term: string, settings: Settings, target: string | null): UniversalSearchPreparedRequest {
        const requestResult = this.definition.buildRequest({
            term,
            settings,
            target,
            page: this.page,
            pageSize: this.pageSize,
            resultsLoaded: this.results.length,
            resultsToFetch: this.resultsToFetch,
        });

        return {
            request: requestResult.request,
            executeSingle: async(searcher, abortSignal) => {
                const response = await this.definition.executeSingle(searcher, requestResult.request, abortSignal);
                if (!abortSignal.aborted) {
                    this.applySearchResult(response ?? undefined, requestResult.facetLabels);
                }
            },
            applyBatchResponse: response => {
                const entityResponse = response.responses?.find(item => this.isResponse(item));
                this.applySearchResult(entityResponse, requestResult.facetLabels);
            },
        };
    }

    resetForSearch(): void {
        const resultsToFetch = this.resultsToFetch;
        this.page = resultsToFetch ? resultsToFetch / this.pageSize : 1;
        this.response = null;
        this.results = [];
        this.stateChanged();
    }

    clear(): void {
        this.response = null;
        this.results = [];
        this.stateChanged();
    }

    clearError(): void {
        this.error = null;
        this.stateChanged();
    }

    setError(): void {
        this.error = this.definition.getLocalization()?.error ?? this.definition.defaultError;
        this.stateChanged();
    }

    setPage(page: number): void {
        this.page = page;
        this.stateChanged();
    }

    render(options: UniversalSearchEntityRenderOptions): TemplateResult {
        return this.definition.render(this, options);
    }

    private isResponse(response: SearchResponse): response is TResponse {
        return '$type' in response && response.$type === this.definition.responseType;
    }

    private applySearchResult(response: TResponse | undefined, facetLabels: string[]): void {
        this.facetLabels = facetLabels;

        if (response) {
            this.response = response;
            this.results = this.results.concat(this.definition.getResults(response));
        }

        this.stateChanged();
    }
}

const productDefinition: UniversalSearchEntityDefinition<ProductSearchRequest, ProductSearchResponse, ProductResult> = {
    id: UniversalSearchTabId.products,
    responseType: 'Relewise.Client.Responses.Search.ProductSearchResponse, Relewise.Client',
    defaultTabLabel: 'Products',
    defaultError: 'Could not load products.',
    getLocalization: () => getRelewiseUISearchOptions()?.localization?.universalSearch?.products,
    buildRequest: options => {
        const tabSettings = universalSearchTabSettings[UniversalSearchTabId.products];
        return buildProductSearchRequest({
            term: options.term,
            settings: options.settings,
            page: options.page,
            pageSize: options.pageSize,
            productsLoaded: options.resultsLoaded,
            productsToFetch: options.resultsToFetch,
            target: options.target,
            facetQueryKeyPrefix: tabSettings.facetQueryKeyPrefix,
            facetUpperboundQueryKeyPrefix: tabSettings.facetUpperboundQueryKeyPrefix,
            facetLowerboundQueryKeyPrefix: tabSettings.facetLowerboundQueryKeyPrefix,
            sortingQueryKey: tabSettings.sortingQueryKey,
        });
    },
    executeSingle: async(searcher, request, abortSignal) => await searcher.searchProducts(request, { abortSignal }),
    getResults: response => response.results ?? [],
    render: (state, options) => renderUniversalSearchProductsTab({
        result: state.response,
        products: state.results,
        facetLabels: state.facetLabels,
        loading: options.loading,
        error: state.error,
        user: options.user,
        target: options.target,
        onLoadMore: options.onLoadMore,
        onSearchOptionsChanged: options.onSearchOptionsChanged,
    }),
};

const productCategoryDefinition: UniversalSearchEntityDefinition<ProductCategorySearchRequest, ProductCategorySearchResponse, ProductCategoryResult> = {
    id: UniversalSearchTabId.productCategories,
    responseType: 'Relewise.Client.Responses.Search.ProductCategorySearchResponse, Relewise.Client',
    defaultTabLabel: 'Categories',
    defaultError: 'Could not load categories.',
    getLocalization: () => getRelewiseUISearchOptions()?.localization?.universalSearch?.productCategories,
    buildRequest: options => {
        const pagination = resolvePagination(options);
        return buildProductCategorySearchRequest({
            term: options.term,
            settings: options.settings,
            page: pagination.page,
            pageSize: pagination.pageSize,
        });
    },
    executeSingle: async(searcher, request, abortSignal) => await searcher.searchProductCategories(request, { abortSignal }),
    getResults: response => response.results ?? [],
    render: (state, options) => renderUniversalSearchProductCategoriesTab({
        result: state.response,
        productCategories: state.results,
        facetLabels: state.facetLabels,
        loading: options.loading,
        error: state.error,
        user: options.user,
        onLoadMore: options.onLoadMore,
        onSearchOptionsChanged: options.onSearchOptionsChanged,
    }),
};

const contentDefinition: UniversalSearchEntityDefinition<ContentSearchRequest, ContentSearchResponse, ContentResult> = {
    id: UniversalSearchTabId.content,
    responseType: 'Relewise.Client.Responses.Search.ContentSearchResponse, Relewise.Client',
    defaultTabLabel: 'Content',
    defaultError: 'Could not load content.',
    getLocalization: () => getRelewiseUISearchOptions()?.localization?.universalSearch?.content,
    buildRequest: options => {
        const pagination = resolvePagination(options);
        return buildContentSearchRequest({
            term: options.term,
            settings: options.settings,
            page: pagination.page,
            pageSize: pagination.pageSize,
        });
    },
    executeSingle: async(searcher, request, abortSignal) => await searcher.searchContents(request, { abortSignal }),
    getResults: response => response.results ?? [],
    render: (state, options) => renderUniversalSearchContentTab({
        result: state.response,
        content: state.results,
        facetLabels: state.facetLabels,
        loading: options.loading,
        error: state.error,
        user: options.user,
        onLoadMore: options.onLoadMore,
        onSearchOptionsChanged: options.onSearchOptionsChanged,
    }),
};

export function createUniversalSearchEntities(
    defaultPageSize: number,
    stateChanged: () => void,
): Record<UniversalSearchTab, UniversalSearchEntity> {
    return {
        [UniversalSearchTabId.products]: new TypedUniversalSearchEntity(productDefinition, defaultPageSize, stateChanged),
        [UniversalSearchTabId.productCategories]: new TypedUniversalSearchEntity(productCategoryDefinition, defaultPageSize, stateChanged),
        [UniversalSearchTabId.content]: new TypedUniversalSearchEntity(contentDefinition, defaultPageSize, stateChanged),
    };
}

function resolvePagination(options: UniversalSearchEntityRequestOptions): { page: number; pageSize: number } {
    if (options.resultsToFetch && options.resultsLoaded < 1) {
        return {
            page: 1,
            pageSize: options.resultsToFetch,
        };
    }

    return {
        page: options.page,
        pageSize: options.pageSize,
    };
}
