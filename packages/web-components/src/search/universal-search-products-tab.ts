import { ProductResult, ProductSearchResponse, SearchResponseCollection, Settings, User } from '@relewise/client';
import { html, nothing } from 'lit';
import type { PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import {
    QueryKeys,
    getRelewiseContextSettings,
    getRelewiseUIOptions,
    getRelewiseUISearchOptions,
    readCurrentUrlState,
    updateUrlState,
} from '../helpers';
import { RelewiseLitElement } from '../relewise-lit-element';
import { buildProductSearchRequest } from './productSearchRequestBuilder';
import { getSearcher } from './searcher';
import { universalSearchTabStyles } from './universal-search-tab.styles';
import type { UniversalSearchBatchSearch } from './universal-search.types';

const defaultPageSize = 15;
const tab = 'products';

export class UniversalSearchProductsTab extends RelewiseLitElement {
    @property() term = '';
    @property({ attribute: false }) target: string | null = null;
    @property({ attribute: false }) hideFacets = false;
    @property({ attribute: false }) hideZeroResults = false;
    @property({ attribute: 'displayed-at-location' }) displayedAtLocation?: string;

    @state() private result: ProductSearchResponse | null = null;
    @state() private products: ProductResult[] = [];
    @state() private facetLabels: string[] = [];
    @state() private loading = false;
    @state() private error: string | null = null;
    @state() private user: User | null = null;

    private page = 1;
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
        void this.search(true);
    };

    private async loadMore(): Promise<void> {
        if (this.loading) {
            return;
        }

        const previousPage = this.page;
        this.page++;

        if (!await this.search(false)) {
            this.page = previousPage;
            return;
        }

        updateUrlState(QueryKeys.productTake, (this.pageSize * this.page).toString());
    }

    prepareBatchSearch(settings: Settings): UniversalSearchBatchSearch {
        this.abortController.abort();
        this.resetForSearch();
        const requestResult = this.buildRequest(settings, true);
        this.loading = true;
        this.user = settings.user;

        return {
            request: requestResult.request,
            applyResponse: response => this.applyBatchResponse(response, requestResult.facetLabels),
            setError: () => this.setError(),
        };
    }

    private async search(reset: boolean): Promise<boolean> {
        this.abortController.abort();

        if (!this.term) {
            this.clear();
            return false;
        }

        if (reset) {
            this.resetForSearch();
        } else {
            this.error = null;
        }

        this.loading = true;
        const abortController = new AbortController();
        this.abortController = abortController;

        try {
            // Let targeted runtime configuration register before the automatic search starts.
            await new Promise(resolve => setTimeout(resolve, 0));
            const settings = await getRelewiseContextSettings(this.displayedAtLocation ?? 'Relewise Universal Search');
            const requestResult = this.buildRequest(settings, reset);
            const response = await getSearcher(getRelewiseUIOptions()).searchProducts(requestResult.request, { abortSignal: abortController.signal });

            if (abortController.signal.aborted) {
                return false;
            }

            this.user = settings.user;
            this.applyResponse(response ?? null, requestResult.facetLabels, reset);
            return true;
        } catch {
            if (!abortController.signal.aborted) {
                this.setError();
            }
            return false;
        } finally {
            if (!abortController.signal.aborted) {
                this.loading = false;
            }
        }
    }

    private buildRequest(settings: Settings, reset: boolean) {
        const resultsToFetch = this.getResultsToFetch();
        return buildProductSearchRequest({
            term: this.term,
            settings,
            page: reset && resultsToFetch ? 1 : this.page,
            pageSize: reset && resultsToFetch ? resultsToFetch : this.pageSize,
            productsLoaded: this.products.length,
            productsToFetch: null,
            target: this.target,
            facetQueryKeyPrefix: QueryKeys.productFacet,
            sortingQueryKey: QueryKeys.productSorting,
        });
    }

    private resetForSearch(): void {
        const resultsToFetch = this.getResultsToFetch();
        this.page = resultsToFetch ? Math.ceil(resultsToFetch / this.pageSize) : 1;
        this.result = null;
        this.products = [];
        this.facetLabels = [];
        this.error = null;
        this.reportHits();
    }

    private applyBatchResponse(response: SearchResponseCollection, facetLabels: string[]): void {
        const productResponse = response.responses?.find(item => '$type' in item
            && item.$type === 'Relewise.Client.Responses.Search.ProductSearchResponse, Relewise.Client') as ProductSearchResponse | undefined;
        this.applyResponse(productResponse ?? null, facetLabels, true);
        this.loading = false;
    }

    private applyResponse(response: ProductSearchResponse | null, facetLabels: string[], reset: boolean): void {
        this.result = response;
        this.products = reset ? response?.results ?? [] : this.products.concat(response?.results ?? []);
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
        this.page = 1;
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
        const facetResult = this.result !== null && this.result.hits > 0 && !this.hideFacets ? this.result.facets : null;

        return html`
            <div class="rw-results-layout" part="results-layout">
                ${facetResult ? html`
                    <relewise-facets
                        class="rw-facets"
                        part="facets"
                        exportparts="container: facet-container, title: facet-title, input: facet-input, label: facet-label, value: facet-value, hits: facet-hits"
                        .labels=${this.facetLabels}
                        .facetQueryKeyPrefix=${QueryKeys.productFacet}
                        .applyFacet=${this.searchOptionsChanged}
                        .facetResult=${facetResult}>
                    </relewise-facets>
                ` : nothing}
                <section class="rw-results" part="results">
                    <header class="rw-results-header" part="results-header">
                        <div>
                            <h2 class="rw-results-title" part="results-title">${localization?.resultsTitle ?? 'Products'}</h2>
                            ${this.result ? html`
                                <span class="rw-results-count" part="results-count">
                                    ${this.result.hits} ${this.result.hits === 1 ? localization?.result ?? 'Result' : localization?.results ?? 'Results'}
                                </span>
                            ` : nothing}
                        </div>
                        ${this.products.length > 0 ? html`
                            <relewise-product-search-sorting
                                class="rw-sorting"
                                part="sorting"
                                .target=${this.target}
                                .sortingQueryKey=${QueryKeys.productSorting}
                                .applySorting=${this.searchOptionsChanged}
                                exportparts="select: sorting-select, label: sorting-label">
                            </relewise-product-search-sorting>
                        ` : nothing}
                    </header>
                    ${this.error ? html`
                        <p class="rw-empty" part="error-state">${this.error}</p>
                    ` : this.loading && this.products.length === 0 ? html`
                        <div class="rw-loading" part="loading-state">
                            <relewise-loading-spinner></relewise-loading-spinner>
                        </div>
                    ` : !this.result ? nothing : this.products.length === 0 ? this.hideZeroResults ? nothing : html`
                        <p class="rw-empty" part="zero-results">${localization?.noResults ?? 'No products found.'}</p>
                    ` : html`
                        <div class="rw-result-grid" part="product-grid">
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
                            .loaded=${this.products.length}
                            .total=${this.result.hits ?? 0}
                            resultLabel=${localization?.results ?? 'products'}
                            .loading=${this.loading}
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
