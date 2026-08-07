import { ContentResult, ContentSearchResponse, User } from '@relewise/client';
import { html, nothing } from 'lit';
import { getRelewiseUISearchOptions } from '../helpers';
import { universalSearchTabSettings } from './universal-search-tab-settings';
import { renderUniversalSearchLoadMore, renderUniversalSearchLoadingState, renderUniversalSearchResultsHeader } from './universal-search-rendering';

export type UniversalSearchContentTabOptions = {
    result: ContentSearchResponse | null;
    content: ContentResult[];
    facetLabels: string[];
    loading: boolean;
    error: string | null;
    user: User | null;
    onLoadMore: () => void;
    onSearchOptionsChanged: () => void;
};

export function renderUniversalSearchContentTab(options: UniversalSearchContentTabOptions) {
    const localization = getRelewiseUISearchOptions()?.localization?.universalSearch?.content;

    return html`
        <div class="rw-results-layout" part="results-layout">
            ${options.result?.facets ? html`
                <relewise-facets
                    class="rw-facets"
                    part="facets"
                    exportparts="container: facet-container, title: facet-title, input: facet-input, label: facet-label, value: facet-value, hits: facet-hits"
                    .labels=${options.facetLabels}
                    .facetQueryKeyPrefix=${universalSearchTabSettings.content.facetQueryKeyPrefix}
                    .facetUpperboundQueryKeyPrefix=${universalSearchTabSettings.content.facetUpperboundQueryKeyPrefix}
                    .facetLowerboundQueryKeyPrefix=${universalSearchTabSettings.content.facetLowerboundQueryKeyPrefix}
                    .applyFacet=${options.onSearchOptionsChanged}
                    .facetResult=${options.result.facets}>
                </relewise-facets>
            ` : nothing}
            <section class="rw-results" part="results">
                <header class="rw-results-header" part="results-header">
                    ${renderUniversalSearchResultsHeader(
                        options.result,
                        localization?.resultsTitle ?? 'Content',
                        localization?.result ?? 'Result',
                        localization?.results ?? 'Results',
                    )}
                </header>
                ${renderContentResults(options)}
            </section>
        </div>
    `;
}

function renderContentResults(options: UniversalSearchContentTabOptions) {
    const localization = getRelewiseUISearchOptions()?.localization?.universalSearch?.content;

    if (options.error) {
        return html`<p class="rw-empty" part="error-state">${options.error}</p>`;
    }

    if (options.loading && options.content.length === 0) {
        return renderUniversalSearchLoadingState();
    }

    if (options.content.length === 0) {
        return html`<p class="rw-empty" part="zero-results">${localization?.noResults ?? 'No content found.'}</p>`;
    }

    return html`
        <div class="rw-result-grid" part="content-grid">
            ${options.content.map(content => html`
                <relewise-content-tile
                    class="rw-content-tile"
                    part="content-tile"
                    .content=${content}
                    .user=${options.user}>
                </relewise-content-tile>
            `)}
        </div>
        ${renderUniversalSearchLoadMore(options.content.length, options.result?.hits ?? 0, localization?.results ?? 'content results', options.loading, options.onLoadMore)}
    `;
}
