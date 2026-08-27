import { ContentResult, ContentSearchResponse, SearchResponseCollection, Settings, User } from '@relewise/client';
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
import { buildContentSearchRequest } from '../../../builders/contentSearchRequestBuilder';
import { getSearcher } from '../../searcher';
import { universalSearchTabStyles } from './tab.styles';
import { hasRenderableFacets } from '../../components/facets/facet-result-visibility';
import type { UniversalSearchBatchSearch } from '../universal-search.types';
import { universalSearchRecommendationsExportParts } from './recommendations';

const defaultPageSize = 15;
const tab = 'content';

export class UniversalSearchContentTab extends RelewiseLitElement {
    @property() term = '';
    @property({ attribute: false }) hideFacets = false;
    @property({ attribute: false }) noResultRecommendationConfiguration: UniversalSearchRecommendationBlock[] = [];
    @property({ type: Boolean, attribute: false }) noResultRecommendationsActive = false;
    @property({ attribute: 'displayed-at-location' }) displayedAtLocation?: string;

    @state() private result: ContentSearchResponse | null = null;
    @state() private content: ContentResult[] = [];
    @state() private facetLabels: string[] = [];
    @state() private loading = false;
    @state() private error: string | null = null;
    @state() private user: User | null = null;

    private page = 1;
    private abortController = new AbortController();

    private get pageSize(): number {
        return getRelewiseUISearchOptions()?.universalSearch?.entities?.content?.pageSize ?? defaultPageSize;
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
        updateUrlState(QueryKeys.contentTake, null);
        void this.search(true, true);
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

        updateUrlState(QueryKeys.contentTake, (this.pageSize * this.page).toString());
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

    private async search(reset: boolean, preserveCurrentResults = false): Promise<boolean> {
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
        const abortController = new AbortController();
        this.abortController = abortController;

        try {
            // Let runtime configuration register before the automatic search starts.
            await new Promise(resolve => setTimeout(resolve, 0));
            const settings = await getRelewiseContextSettings(this.displayedAtLocation ?? 'Relewise Universal Search');
            const requestResult = this.buildRequest(settings, reset);
            const response = await getSearcher(getRelewiseUIOptions()).searchContents(requestResult.request, { abortSignal: abortController.signal });

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
        return buildContentSearchRequest({
            term: this.term,
            settings,
            page: reset && resultsToFetch ? 1 : this.page,
            pageSize: reset && resultsToFetch ? resultsToFetch : this.pageSize,
        });
    }

    private resetForSearch(preserveCurrentResults = false): void {
        const resultsToFetch = this.getResultsToFetch();
        this.page = resultsToFetch ? Math.ceil(resultsToFetch / this.pageSize) : 1;
        this.error = null;
        if (!preserveCurrentResults) {
            this.result = null;
            this.content = [];
            this.facetLabels = [];
            this.reportHits();
        }
    }

    private applyBatchResponse(response: SearchResponseCollection, facetLabels: string[]): void {
        const contentResponse = response.responses?.find(item => '$type' in item
            && item.$type === 'Relewise.Client.Responses.Search.ContentSearchResponse, Relewise.Client') as ContentSearchResponse | undefined;
        this.applyResponse(contentResponse ?? null, facetLabels, true);
        this.loading = false;
    }

    private applyResponse(response: ContentSearchResponse | null, facetLabels: string[], reset: boolean): void {
        this.result = response;
        this.content = reset ? response?.results ?? [] : this.content.concat(response?.results ?? []);
        this.facetLabels = facetLabels;
        this.reportHits();
    }

    private setError(): void {
        this.error = getRelewiseUISearchOptions()?.localization?.universalSearch?.content?.error ?? 'Could not load content.';
        this.loading = false;
    }

    private clear(): void {
        this.abortController.abort();
        this.result = null;
        this.content = [];
        this.facetLabels = [];
        this.error = null;
        this.loading = false;
        this.page = 1;
        this.reportHits();
    }

    private getResultsToFetch(): number | null {
        const value = readCurrentUrlState(QueryKeys.contentTake);
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
        const localization = getRelewiseUISearchOptions()?.localization?.universalSearch?.content;
        const noResultsHint = localization?.noResultsHint ?? 'Try another search term or check the spelling.';
        const hasSearchTermAndSelectedFacets = Boolean(readCurrentUrlState(QueryKeys.term))
            && hasUrlStateWithPrefix(QueryKeys.contentFacet);
        const facetResult = this.result !== null && !this.hideFacets && (this.result.hits > 0 || hasSearchTermAndSelectedFacets) ? this.result.facets : null;
        const totalHits = this.result?.hits;

        return html`
            <div class="rw-results-layout" part="results-layout">
                ${facetResult && hasRenderableFacets(facetResult, totalHits) ? html`
                    <relewise-universal-search-facets
                        class="rw-facets"
                        part="facets"
                        exportparts="facet-trigger, facet-panel, facet-drawer, facet-drawer-backdrop, facet-drawer-header, facet-drawer-close, facet-container, facet-title, facet-input, facet-label, facet-value, facet-hits"
                        .labels=${this.facetLabels}
                        .facetQueryKeyPrefix=${QueryKeys.contentFacet}
                        .facetResult=${facetResult}
                        .totalHits=${totalHits}
                        @universal-search-facets-changed=${this.searchOptionsChanged}>
                    </relewise-universal-search-facets>
                ` : nothing}
                <section class="rw-results" part="results">
                    ${this.result && this.result.hits !== 0 ? html`
                        <header class="rw-results-header" part="results-header">
                            <div>
                                <h2 class="rw-results-title" part="results-title">${localization?.resultsTitle ?? 'Content'}</h2>
                                ${this.result ? html`
                                    <span class="rw-results-count" part="results-count">
                                        ${this.result.hits} ${this.result.hits === 1 ? localization?.result ?? 'Result' : localization?.results ?? 'Results'}
                                    </span>
                                ` : nothing}
                            </div>
                        </header>
                    ` : nothing}
                    ${this.error ? html`
                        <p class="rw-empty" part="error-state">${this.error}</p>
                    ` : this.loading && this.content.length === 0 ? html`
                        <div class="rw-loading" part="loading-state">
                            <relewise-loading-spinner></relewise-loading-spinner>
                        </div>
                    ` : !this.result ? nothing : this.content.length === 0 ? html`
                        <div class="rw-zero-results" part="zero-results" role="status">
                            <span class="rw-zero-results-icon" part="zero-results-icon" aria-hidden="true">
                                <relewise-search-icon></relewise-search-icon>
                            </span>
                            <div>
                                <p class="rw-zero-results-title" part="zero-results-title">${localization?.noResults ?? 'No content found.'}</p>
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
                        <div class="rw-result-grid rw-content-grid" part="content-grid">
                            ${this.content.map(content => html`
                                <relewise-content-tile
                                    class="rw-content-tile"
                                    part="content-tile"
                                    .content=${content}
                                    .user=${this.user}>
                                </relewise-content-tile>
                            `)}
                        </div>
                        <relewise-universal-search-load-more
                            exportparts="loading-state, load-more"
                            .loaded=${this.content.length}
                            .total=${this.result.hits ?? 0}
                            resultLabel=${localization?.results ?? 'content results'}
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
        'relewise-universal-search-content-tab': UniversalSearchContentTab;
    }
}
