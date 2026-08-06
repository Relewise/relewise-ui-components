import { html, nothing } from 'lit';
import { getRelewiseUISearchOptions } from '../helpers';
import type { UniversalSearchResult } from './universal-search.types';

export function renderUniversalSearchResultsHeader(
    result: UniversalSearchResult | null,
    resultsTitle: string,
    resultLabel: string,
    resultsLabel: string,
) {
    return html`
        <div>
            <h2 class="rw-results-title" part="results-title">${resultsTitle}</h2>
            ${result ? html`
                <span class="rw-results-count" part="results-count">${result.hits} ${result.hits === 1 ? resultLabel : resultsLabel}</span>
            ` : nothing}
        </div>
    `;
}

export function renderUniversalSearchLoadingState() {
    return html`
        <div class="rw-loading" part="loading-state">
            <relewise-loading-spinner></relewise-loading-spinner>
        </div>
    `;
}

export function renderUniversalSearchLoadMore(loaded: number, total: number, resultLabel: string, loading: boolean, onLoadMore: () => void) {
    const localization = getRelewiseUISearchOptions()?.localization?.loadMoreButton;

    return html`
        ${loading ? renderUniversalSearchLoadingState() : nothing}
        ${!loading && loaded < total ? html`
            <div class="rw-load-more" part="load-more">
                <span class="rw-results-shown">
                    ${localization?.showing ?? 'Showing'} ${loaded} ${localization?.outOf ?? 'out of'} ${total} ${resultLabel}
                </span>
                <relewise-button @click=${onLoadMore}>
                    <span>${localization?.loadMore ?? 'Load More'}</span>
                </relewise-button>
            </div>
        ` : nothing}
    `;
}
