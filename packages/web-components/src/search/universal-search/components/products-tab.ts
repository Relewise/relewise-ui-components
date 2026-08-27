import { ProductResult, ProductSearchResponse, SearchResponseCollection, Settings, User } from '@relewise/client';
import { html, nothing } from 'lit';
import type { PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { UniversalSearchRecommendationBlock } from '../../../app';
import {
    QueryKeys,
    getRelewiseContextSettings,
    getRelewiseUIOptions,
    getRelewiseUISearchOptions,
    hasUrlStateWithPrefix,
    readCurrentUrlState,
    updateUrlState,
} from '../../../helpers';
import { RelewiseLitElement } from '../../../relewise-lit-element';
import { buildProductSearchRequest } from '../../../builders/productSearchRequestBuilder';
import { getSearcher } from '../../searcher';
import { universalSearchTabStyles } from './tab.styles';
import { hasRenderableFacets } from '../../components/facets/facet-result-visibility';
import type { UniversalSearchBatchSearch } from '../universal-search.types';
import { universalSearchRecommendationsExportParts } from './recommendations';

const defaultPageSize = 15;
const tab = 'products';

export class UniversalSearchProductsTab extends RelewiseLitElement {
    @property() term = '';
    @property({ attribute: false }) target: string | null = null;
    @property({ attribute: false }) hideFacets = false;
    @property({ attribute: false }) noResultRecommendationConfiguration: UniversalSearchRecommendationBlock[] = [];
    @property({ type: Boolean, attribute: false }) noResultRecommendationsActive = false;
    @property({ attribute: 'displayed-at-location' }) displayedAtLocation?: string;

    @state() private result: ProductSearchResponse | null = null;
    @state() private products: ProductResult[] = [];
    @state() private facetLabels: string[] = [];
    @state() private loading = false;
    @state() private loadingDirection: 'next' | 'previous' | null = null;
    @state() private error: string | null = null;
    @state() private user: User | null = null;

    private resultOffset = 0;
    private abortController = new AbortController();

    private get pageSize(): number {
        return getRelewiseUISearchOptions()?.universalSearch?.entities?.products?.pageSize ?? defaultPageSize;
    }

    protected willUpdate(changedProperties: PropertyValues<this>): void {
        if (changedProperties.has('term') && !this.term) {
            this.clear();
        }
    }

    disconnectedCallback(): void {
        this.abortController.abort();
        super.disconnectedCallback();
    }

    private readonly searchOptionsChanged = (): void => {
        updateUrlState(QueryKeys.productTake, null);
        void this.search(true, true);
    };

    private async loadMore(): Promise<void> {
        if (this.loading) {
            return;
        }

        if (!await this.search(false)) {
            return;
        }

        updateUrlState(QueryKeys.productTake, (this.resultOffset + this.products.length).toString());
    }

    private async loadPrevious(): Promise<void> {
        if (this.loading || this.resultOffset === 0) {
            return;
        }

        await this.search(false, false, 'previous');
    }

    prepareBatchSearch(settings: Settings): UniversalSearchBatchSearch {
        this.abortController.abort();
        this.resetForSearch();
        const requestResult = this.buildRequest(settings, true);
        this.loading = true;
        this.user = settings.user;

        return {
            request: requestResult.request,
            applyResponse: response => this.applyBatchResponse(response, requestResult.facetLabels, requestResult.request.skip),
            setError: () => this.setError(),
        };
    }

    private async search(reset: boolean, preserveCurrentResults = false, direction: 'next' | 'previous' = 'next'): Promise<boolean> {
        this.abortController.abort();

        if (!this.term) {
            this.clear();
            return false;
        }

        if (reset) {
            this.resetForSearch(preserveCurrentResults);
        } else {
            this.error = null;
        }

        this.loading = true;
        this.loadingDirection = reset ? null : direction;
        const abortController = new AbortController();
        this.abortController = abortController;

        try {
            // Let targeted runtime configuration register before the automatic search starts.
            await new Promise(resolve => setTimeout(resolve, 0));
            const settings = await getRelewiseContextSettings(this.displayedAtLocation ?? 'Relewise Universal Search');
            const requestResult = this.buildRequest(settings, reset, direction);
            const response = await getSearcher(getRelewiseUIOptions()).searchProducts(requestResult.request, { abortSignal: abortController.signal });

            if (abortController.signal.aborted) {
                return false;
            }

            this.user = settings.user;
            this.applyResponse(response ?? null, requestResult.facetLabels, reset, direction === 'previous', requestResult.request.skip);
            return true;
        } catch {
            if (!abortController.signal.aborted) {
                this.setError();
            }
            return false;
        } finally {
            if (!abortController.signal.aborted) {
                this.loading = false;
                this.loadingDirection = null;
            }
        }
    }

    private buildRequest(settings: Settings, reset: boolean, direction: 'next' | 'previous' = 'next') {
        const pagination = this.getPagination(reset, direction);
        const requestResult = buildProductSearchRequest({
            term: this.term,
            settings,
            page: 1,
            pageSize: pagination.take,
            productsLoaded: this.products.length,
            productsToFetch: null,
            target: this.target,
            facetQueryKeyPrefix: QueryKeys.productFacet,
            sortingQueryKey: QueryKeys.productSorting,
        });
        requestResult.request.take = pagination.take;
        requestResult.request.skip = pagination.skip;

        return requestResult;
    }

    private getPagination(reset: boolean, direction: 'next' | 'previous'): { take: number; skip: number } {
        const resultsToFetch = this.getResultsToFetch();
        if (reset && resultsToFetch) {
            const take = Math.min(resultsToFetch, this.pageSize);
            return { take, skip: resultsToFetch - take };
        }

        if (direction === 'previous') {
            const take = Math.min(this.resultOffset, this.pageSize);
            return { take, skip: this.resultOffset - take };
        }

        return {
            take: this.pageSize,
            skip: reset ? 0 : this.resultOffset + this.products.length,
        };
    }

    private resetForSearch(preserveCurrentResults = false): void {
        const resultsToFetch = this.getResultsToFetch();
        this.resultOffset = resultsToFetch ? Math.max(0, resultsToFetch - this.pageSize) : 0;
        this.error = null;
        if (!preserveCurrentResults) {
            this.result = null;
            this.products = [];
            this.facetLabels = [];
            this.reportHits();
        }
    }

    private applyBatchResponse(response: SearchResponseCollection, facetLabels: string[], resultOffset: number): void {
        const productResponse = response.responses?.find(item => '$type' in item
            && item.$type === 'Relewise.Client.Responses.Search.ProductSearchResponse, Relewise.Client') as ProductSearchResponse | undefined;
        if (productResponse?.hits
            && !productResponse.results?.length
            && resultOffset >= productResponse.hits) {
            updateUrlState(QueryKeys.productTake, productResponse.hits.toString());
            void this.search(true);
            return;
        }

        this.applyResponse(productResponse ?? null, facetLabels, true, false, resultOffset);
        this.loading = false;
    }

    private applyResponse(response: ProductSearchResponse | null, facetLabels: string[], reset: boolean, prepend: boolean, resultOffset: number): void {
        this.result = response;
        const results = response?.results ?? [];
        this.products = reset
            ? results
            : prepend
                ? results.concat(this.products)
                : this.products.concat(results);
        if (reset || prepend) {
            this.resultOffset = resultOffset;
        }
        this.facetLabels = facetLabels;
        this.reportHits();
    }

    private setError(): void {
        this.error = getRelewiseUISearchOptions()?.localization?.universalSearch?.products?.error ?? 'Could not load products.';
        this.loading = false;
    }

    private clear(): void {
        this.abortController.abort();
        this.result = null;
        this.products = [];
        this.facetLabels = [];
        this.error = null;
        this.loading = false;
        this.resultOffset = 0;
        this.loadingDirection = null;
        this.reportHits();
    }

    private getResultsToFetch(): number | null {
        const value = readCurrentUrlState(QueryKeys.productTake);
        const parsedValue = value ? parseInt(value, 10) : NaN;
        return isNaN(parsedValue) ? null : parsedValue;
    }

    private reportHits(): void {
        this.dispatchEvent(new CustomEvent('universal-search-tab-state-changed', {
            bubbles: true,
            composed: true,
            detail: { tab, hits: this.result?.hits ?? null },
        }));
    }

    render() {
        const localization = getRelewiseUISearchOptions()?.localization?.universalSearch?.products;
        const noResultsHint = localization?.noResultsHint ?? 'Try another search term or check the spelling.';
        const hasSearchTermAndSelectedFacets = Boolean(readCurrentUrlState(QueryKeys.term))
            && hasUrlStateWithPrefix(QueryKeys.productFacet);
        const facetResult = this.result !== null && !this.hideFacets && (this.result.hits > 0 || hasSearchTermAndSelectedFacets) ? this.result.facets : null;
        const totalHits = this.result?.hits;
        const facets = facetResult && hasRenderableFacets(facetResult, totalHits) ? html`
            <relewise-universal-search-facets
                class="rw-facets"
                part="facets"
                exportparts="facet-trigger, facet-panel, facet-drawer, facet-drawer-backdrop, facet-drawer-header, facet-drawer-close, facet-container, facet-title, facet-input, facet-label, facet-value, facet-hits"
                .labels=${this.facetLabels}
                .facetQueryKeyPrefix=${QueryKeys.productFacet}
                .facetResult=${facetResult}
                .totalHits=${totalHits}
                @universal-search-facets-changed=${this.searchOptionsChanged}>
            </relewise-universal-search-facets>
        ` : nothing;
        const sorting = this.products.length > 0 ? html`
            <div class="rw-sorting" part="sorting">
                <relewise-product-search-sorting
                    .target=${this.target}
                    .sortingQueryKey=${QueryKeys.productSorting}
                    .applySorting=${this.searchOptionsChanged}
                    exportparts="container: sorting-container, select: sorting-select, label: sorting-label">
                </relewise-product-search-sorting>
                <span class="rw-sorting-chevron" aria-hidden="true"></span>
            </div>
        ` : nothing;
        return html`
            <div class="rw-results-layout rw-product-results-layout" part="results-layout">
                ${facets}
                ${sorting}
                ${this.result && this.result.hits !== 0 ? html`
                    <header class="rw-results-header" part="results-header">
                        <div>
                            <h2 class="rw-results-title" part="results-title">${localization?.resultsTitle ?? 'Products'}</h2>
                            ${this.result ? html`
                                <span class="rw-results-count" part="results-count">
                                    ${this.result.hits} ${this.result.hits === 1 ? localization?.result ?? 'Result' : localization?.results ?? 'Results'}
                                </span>
                            ` : nothing}
                        </div>
                    </header>
                ` : nothing}
                <section class="rw-results" part="results">
                    ${this.error ? html`
                        <p class="rw-empty" part="error-state">${this.error}</p>
                    ` : this.loading && this.products.length === 0 ? html`
                        <div class="rw-loading" part="loading-state">
                            <relewise-loading-spinner></relewise-loading-spinner>
                        </div>
                    ` : !this.result ? nothing : this.products.length === 0 ? html`
                        <div class="rw-zero-results" part="zero-results" role="status">
                            <span class="rw-zero-results-icon" part="zero-results-icon" aria-hidden="true">
                                <relewise-search-icon></relewise-search-icon>
                            </span>
                            <div>
                                <p class="rw-zero-results-title" part="zero-results-title">${localization?.noResults ?? 'No products found.'}</p>
                                ${noResultsHint ? html`
                                    <p class="rw-zero-results-hint" part="zero-results-hint">
                                        ${noResultsHint}
                                    </p>
                                ` : nothing}
                            </div>
                        </div>
                        <relewise-universal-search-recommendations
                            exportparts=${universalSearchRecommendationsExportParts}
                            .active=${this.noResultRecommendationsActive}
                            .configuration=${this.noResultRecommendationConfiguration}
                            .term=${this.term}
                            .displayedAtLocation=${this.displayedAtLocation}>
                        </relewise-universal-search-recommendations>
                    ` : html`
                        <relewise-universal-search-load-more
                            direction="previous"
                            exportparts="loading-state, load-previous"
                            .offset=${this.resultOffset}
                            .loaded=${this.products.length}
                            .total=${this.result.hits ?? 0}
                            .showStatus=${false}
                            .loading=${this.loading && this.loadingDirection === 'previous'}
                            @universal-search-load-previous=${this.loadPrevious}>
                        </relewise-universal-search-load-more>
                        <div class="rw-result-grid rw-product-grid" part="product-grid">
                            ${this.products.map(product => html`
                                <relewise-product-tile
                                    class="rw-product-tile"
                                    part="product-tile"
                                    .product=${product}
                                    .user=${this.user}>
                                </relewise-product-tile>
                            `)}
                        </div>
                        <relewise-universal-search-load-more
                            exportparts="loading-state, load-more"
                            .offset=${this.resultOffset}
                            .loaded=${this.products.length}
                            .total=${this.result.hits ?? 0}
                            resultLabel=${localization?.results ?? 'products'}
                            .loading=${this.loading && this.loadingDirection === 'next'}
                            @universal-search-load-more=${this.loadMore}>
                        </relewise-universal-search-load-more>
                    `}
                </section>
            </div>
        `;
    }

    static styles = universalSearchTabStyles;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-universal-search-products-tab': UniversalSearchProductsTab;
    }
}
