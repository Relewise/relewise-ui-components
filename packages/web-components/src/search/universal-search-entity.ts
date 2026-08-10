import type {
    SearchResponseCollection,
    Searcher,
    Settings,
} from '@relewise/client';
import type { UniversalSearchTabLocalization } from '../app';
import { updateUrlState } from '../helpers';
import { getUniversalSearchPageSize } from './universal-search-options';
import { UniversalSearchTab, getUniversalSearchTabQueryKeys } from './universal-search-tab-settings';
import { getNumberOfUniversalSearchResultsToFetch } from './universal-search-url-state';
import type { UniversalSearchRequest, UniversalSearchResult, UniversalSearchResultItem } from './universal-search.types';

type SearchResponse = NonNullable<SearchResponseCollection['responses']>[number];

export type UniversalSearchPreparedRequest = {
    request: UniversalSearchRequest;
    executeSingle: (searcher: Searcher, abortSignal: AbortSignal) => Promise<void>;
    applyBatchResponse: (response: SearchResponseCollection) => void;
};

export type UniversalSearchEntityRequestOptions = {
    term: string;
    settings: Settings;
    target: string | null;
    page: number;
    pageSize: number;
    resultsLoaded: number;
    resultsToFetch: number | null;
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
    loadMore(search: () => Promise<boolean>): Promise<void>;
}

export abstract class UniversalSearchEntityBase<
    TRequest extends UniversalSearchRequest,
    TResponse extends UniversalSearchResult & SearchResponse,
    TResult extends UniversalSearchResultItem,
> implements UniversalSearchEntity {
    abstract readonly id: UniversalSearchTab;
    protected abstract readonly responseType: string;
    protected abstract readonly defaultTabLabel: string;
    protected abstract readonly defaultError: string;

    response: TResponse | null = null;
    results: TResult[] = [];
    page = 1;
    facetLabels: string[] = [];
    error: string | null = null;

    constructor(
        private readonly defaultPageSize: number,
        private readonly stateChanged: () => void,
    ) { }

    protected abstract get localization(): UniversalSearchTabLocalization | undefined;

    protected abstract buildRequest(options: UniversalSearchEntityRequestOptions): { request: TRequest; facetLabels: string[] };

    protected abstract executeRequest(searcher: Searcher, request: TRequest, abortSignal: AbortSignal): Promise<TResponse | null | undefined>;

    get pageSize(): number {
        return getUniversalSearchPageSize(this.id, this.defaultPageSize);
    }

    get tabLabel(): string {
        return this.localization?.tab ?? this.defaultTabLabel;
    }

    get resultsForLabel(): string {
        return this.localization?.resultsFor ?? 'Search results for';
    }

    prepareRequest(term: string, settings: Settings, target: string | null): UniversalSearchPreparedRequest {
        const requestResult = this.buildRequest({
            term,
            settings,
            target,
            page: this.page,
            pageSize: this.pageSize,
            resultsLoaded: this.results.length,
            resultsToFetch: getNumberOfUniversalSearchResultsToFetch(this.id),
        });

        return {
            request: requestResult.request,
            executeSingle: async(searcher, abortSignal) => {
                const response = await this.executeRequest(searcher, requestResult.request, abortSignal);
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
        const resultsToFetch = getNumberOfUniversalSearchResultsToFetch(this.id);
        this.page = resultsToFetch ? resultsToFetch / this.pageSize : 1;
        this.response = null;
        this.results = [];
        this.error = null;
        this.stateChanged();
    }

    clear(): void {
        this.response = null;
        this.results = [];
        this.error = null;
        this.stateChanged();
    }

    clearError(): void {
        this.error = null;
        this.stateChanged();
    }

    setError(): void {
        this.error = this.localization?.error ?? this.defaultError;
        this.stateChanged();
    }

    async loadMore(search: () => Promise<boolean>): Promise<void> {
        const previousPage = this.page;
        const requestedPage = previousPage + 1;
        this.setPage(requestedPage);

        const succeeded = await search();
        if (!succeeded) {
            if (this.page === requestedPage) {
                this.setPage(previousPage);
            }
            return;
        }

        if (this.page === requestedPage) {
            updateUrlState(getUniversalSearchTabQueryKeys(this.id).take, (this.pageSize * requestedPage).toString());
        }
    }

    protected resolvePagination(options: UniversalSearchEntityRequestOptions): { page: number; pageSize: number } {
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

    private setPage(page: number): void {
        this.page = page;
        this.stateChanged();
    }

    private isResponse(response: SearchResponse): response is TResponse {
        return '$type' in response && response.$type === this.responseType;
    }

    private applySearchResult(response: TResponse | undefined, facetLabels: string[]): void {
        this.facetLabels = facetLabels;

        if (response) {
            this.response = response;
            this.results = this.results.concat((response.results ?? []) as TResult[]);
        }

        this.stateChanged();
    }
}
