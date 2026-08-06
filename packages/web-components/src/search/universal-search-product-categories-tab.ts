import { ProductCategoryResult, ProductCategorySearchResponse, User } from '@relewise/client';
import { html, nothing } from 'lit';
import { getRelewiseUISearchOptions } from '../helpers';
import { universalSearchTabSettings } from './universal-search-tab-settings';
import { renderUniversalSearchLoadMore, renderUniversalSearchLoadingState, renderUniversalSearchResultsHeader } from './universal-search-rendering';

export type UniversalSearchProductCategoriesTabOptions = {
    result: ProductCategorySearchResponse | null;
    productCategories: ProductCategoryResult[];
    facetLabels: string[];
    loading: boolean;
    error: string | null;
    user: User | null;
    onLoadMore: () => void;
    onSearchOptionsChanged: () => void;
};

export function renderUniversalSearchProductCategoriesTab(options: UniversalSearchProductCategoriesTabOptions) {
    const localization = getRelewiseUISearchOptions()?.localization?.universalSearch?.productCategories;

    return html`
        <div class="rw-results-layout" part="results-layout">
            ${options.result?.facets ? html`
                <relewise-facets
                    class="rw-facets"
                    part="facets"
                    exportparts="container: facet-container, title: facet-title, input: facet-input, label: facet-label, value: facet-value, hits: facet-hits"
                    .labels=${options.facetLabels}
                    .facetQueryKeyPrefix=${universalSearchTabSettings.productCategories.facetQueryKeyPrefix}
                    .facetUpperboundQueryKeyPrefix=${universalSearchTabSettings.productCategories.facetUpperboundQueryKeyPrefix}
                    .facetLowerboundQueryKeyPrefix=${universalSearchTabSettings.productCategories.facetLowerboundQueryKeyPrefix}
                    .applyFacet=${options.onSearchOptionsChanged}
                    .facetResult=${options.result.facets}>
                </relewise-facets>
            ` : nothing}
            <section class="rw-results" part="results">
                <header class="rw-results-header" part="results-header">
                    ${renderUniversalSearchResultsHeader(
                        options.result,
                        localization?.resultsTitle ?? 'Categories',
                        localization?.result ?? 'Result',
                        localization?.results ?? 'Results',
                    )}
                </header>
                ${renderProductCategoryResults(options)}
            </section>
        </div>
    `;
}

function renderProductCategoryResults(options: UniversalSearchProductCategoriesTabOptions) {
    const localization = getRelewiseUISearchOptions()?.localization?.universalSearch?.productCategories;

    if (options.error) {
        return html`<p class="rw-empty" part="error-state">${options.error}</p>`;
    }

    if (options.loading && options.productCategories.length === 0) {
        return renderUniversalSearchLoadingState();
    }

    if (options.productCategories.length === 0) {
        return html`<p class="rw-empty" part="zero-results">${localization?.noResults ?? 'No categories found.'}</p>`;
    }

    return html`
        <div class="rw-result-grid" part="category-grid">
            ${options.productCategories.map(category => html`
                <relewise-category-tile
                    class="rw-category-tile"
                    part="category-tile"
                    .category=${category}
                    .user=${options.user}>
                </relewise-category-tile>
            `)}
        </div>
        ${renderUniversalSearchLoadMore(options.productCategories.length, options.result?.hits ?? 0, localization?.results ?? 'categories', options.loading, options.onLoadMore)}
    `;
}
