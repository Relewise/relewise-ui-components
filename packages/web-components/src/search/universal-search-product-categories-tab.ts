import { ProductCategoryResult, ProductCategorySearchResponse, User } from '@relewise/client';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { getRelewiseUISearchOptions } from '../helpers';
import { RelewiseLitElement } from '../relewise-lit-element';
import { universalSearchTabStyles } from './universal-search-tab.styles';
import { UniversalSearchTabId, getUniversalSearchTabQueryKeys } from './universal-search-tab-settings';

const queryKeys = getUniversalSearchTabQueryKeys(UniversalSearchTabId.productCategories);

export class UniversalSearchProductCategoriesTab extends RelewiseLitElement {
    @property({ attribute: false }) result: ProductCategorySearchResponse | null = null;
    @property({ attribute: false }) productCategories: ProductCategoryResult[] = [];
    @property({ attribute: false }) facetLabels: string[] = [];
    @property({ type: Boolean }) loading = false;
    @property({ attribute: false }) error: string | null = null;
    @property({ attribute: false }) user: User | null = null;

    private readonly searchOptionsChanged = () => this.dispatchEvent(new Event('universal-search-options-changed', { bubbles: true, composed: true }));

    render() {
        const localization = getRelewiseUISearchOptions()?.localization?.universalSearch?.productCategories;

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
                            <h2 class="rw-results-title" part="results-title">${localization?.resultsTitle ?? 'Categories'}</h2>
                            ${this.result ? html`
                                <span class="rw-results-count" part="results-count">
                                    ${this.result.hits} ${this.result.hits === 1 ? localization?.result ?? 'Result' : localization?.results ?? 'Results'}
                                </span>
                            ` : nothing}
                        </div>
                    </header>
                    ${this.error ? html`
                        <p class="rw-empty" part="error-state">${this.error}</p>
                    ` : this.loading && this.productCategories.length === 0 ? html`
                        <div class="rw-loading" part="loading-state">
                            <relewise-loading-spinner></relewise-loading-spinner>
                        </div>
                    ` : this.productCategories.length === 0 ? html`
                        <p class="rw-empty" part="zero-results">${localization?.noResults ?? 'No categories found.'}</p>
                    ` : html`
                        <div class="rw-result-grid" part="category-grid">
                            ${this.productCategories.map(category => html`
                                <relewise-category-tile
                                    class="rw-category-tile"
                                    part="category-tile"
                                    .category=${category}
                                    .user=${this.user}>
                                </relewise-category-tile>
                            `)}
                        </div>
                        <relewise-universal-search-load-more
                            exportparts="loading-state, load-more"
                            .loaded=${this.productCategories.length}
                            .total=${this.result?.hits ?? 0}
                            resultLabel=${localization?.results ?? 'categories'}
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
        'relewise-universal-search-product-categories-tab': UniversalSearchProductCategoriesTab;
    }
}
