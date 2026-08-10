import { ProductResult, ProductSearchResponse, User } from '@relewise/client';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { getRelewiseUISearchOptions } from '../helpers';
import { RelewiseLitElement } from '../relewise-lit-element';
import { universalSearchTabStyles } from './universal-search-tab.styles';
import { UniversalSearchTabId, getUniversalSearchTabQueryKeys } from './universal-search-tab-settings';

const queryKeys = getUniversalSearchTabQueryKeys(UniversalSearchTabId.products);

export class UniversalSearchProductsTab extends RelewiseLitElement {
    @property({ attribute: false }) result: ProductSearchResponse | null = null;
    @property({ attribute: false }) products: ProductResult[] = [];
    @property({ attribute: false }) facetLabels: string[] = [];
    @property({ type: Boolean }) loading = false;
    @property({ attribute: false }) error: string | null = null;
    @property({ attribute: false }) user: User | null = null;
    @property({ attribute: false }) target: string | null = null;

    private readonly searchOptionsChanged = () => this.dispatchEvent(new Event('universal-search-options-changed', { bubbles: true, composed: true }));

    render() {
        const localization = getRelewiseUISearchOptions()?.localization?.universalSearch?.products;

        return html`
            <div class="rw-results-layout" part="results-layout">
                ${this.result?.facets ? html`
                    <relewise-facets
                        class="rw-facets"
                        part="facets"
                        exportparts="container: facet-container, title: facet-title, input: facet-input, label: facet-label, value: facet-value, hits: facet-hits"
                        .labels=${this.facetLabels}
                        .facetQueryKeyPrefix=${queryKeys.facet}
                        .facetUpperboundQueryKeyPrefix=${queryKeys.facetUpperbound}
                        .facetLowerboundQueryKeyPrefix=${queryKeys.facetLowerbound}
                        .applyFacet=${this.searchOptionsChanged}
                        .facetResult=${this.result.facets}>
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
                                .sortingQueryKey=${queryKeys.sorting}
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
                    ` : !this.result ? nothing : this.products.length === 0 ? html`
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
                            .loading=${this.loading}>
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
