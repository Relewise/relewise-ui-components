import { ProductResult, ProductSearchResponse, User } from '@relewise/client';
import { html, nothing } from 'lit';
import { getRelewiseUISearchOptions } from '../helpers';
import { universalSearchTabSettings } from './universal-search-tab-settings';
import { renderUniversalSearchLoadMore, renderUniversalSearchLoadingState, renderUniversalSearchResultsHeader } from './universal-search-rendering';

export type UniversalSearchProductsTabOptions = {
    result: ProductSearchResponse | null;
    products: ProductResult[];
    facetLabels: string[];
    loading: boolean;
    error: string | null;
    user: User | null;
    target: string | null;
    onLoadMore: () => void;
};

export function renderUniversalSearchProductsTab(options: UniversalSearchProductsTabOptions) {
    const localization = getRelewiseUISearchOptions()?.localization?.universalSearch?.products;

    return html`
        <div class="rw-results-layout" part="results-layout">
            ${options.products.length > 0 && options.result?.facets ? html`
                <relewise-facets
                    class="rw-facets"
                    part="facets"
                    exportparts="container: facet-container, title: facet-title, input: facet-input, label: facet-label, value: facet-value, hits: facet-hits"
                    .labels=${options.facetLabels}
                    .facetQueryKeyPrefix=${universalSearchTabSettings.products.facetQueryKeyPrefix}
                    .facetUpperboundQueryKeyPrefix=${universalSearchTabSettings.products.facetUpperboundQueryKeyPrefix}
                    .facetLowerboundQueryKeyPrefix=${universalSearchTabSettings.products.facetLowerboundQueryKeyPrefix}
                    .facetResult=${options.result.facets}>
                </relewise-facets>
            ` : nothing}
            <section class="rw-results" part="results">
                <header class="rw-results-header" part="results-header">
                    ${renderUniversalSearchResultsHeader(
                        options.result,
                        localization?.resultsTitle ?? 'Products',
                        localization?.result ?? 'Result',
                        localization?.results ?? 'Results',
                    )}
                    ${options.products.length > 0 ? html`
                        <relewise-product-search-sorting
                            class="rw-sorting"
                            part="sorting"
                            .target=${options.target}
                            exportparts="select: sorting-select, label: sorting-label">
                        </relewise-product-search-sorting>
                    ` : nothing}
                </header>
                ${renderProductResults(options)}
            </section>
        </div>
    `;
}

function renderProductResults(options: UniversalSearchProductsTabOptions) {
    const localization = getRelewiseUISearchOptions()?.localization?.universalSearch?.products;

    if (options.error) {
        return html`<p class="rw-empty" part="error-state">${options.error}</p>`;
    }

    if (options.loading && options.products.length === 0) {
        return renderUniversalSearchLoadingState();
    }

    if (!options.result) {
        return nothing;
    }

    if (options.products.length === 0) {
        return html`<p class="rw-empty" part="zero-results">${localization?.noResults ?? 'No products found.'}</p>`;
    }

    return html`
        <div class="rw-result-grid" part="product-grid">
            ${options.products.map(product => html`
                <relewise-product-tile
                    class="rw-product-tile"
                    part="product-tile"
                    .product=${product}
                    .user=${options.user}>
                </relewise-product-tile>
            `)}
        </div>
        ${renderUniversalSearchLoadMore(options.products.length, options.result?.hits ?? 0, localization?.results ?? 'products', options.loading, options.onLoadMore)}
    `;
}
