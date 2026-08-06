import { html, nothing } from 'lit';
import { getRelewiseUISearchOptions } from '../helpers';
import { getUniversalSearchTabLocalization } from './universal-search-localization';
import type { TemplateResult } from 'lit';
import type { UniversalSearchResult, UniversalSearchTab } from './universal-search.types';

export type UniversalSearchViewOptions = {
    term: string;
    tabs: UniversalSearchTab[];
    activeTab: UniversalSearchTab | null;
    tabResults: Record<UniversalSearchTab, UniversalSearchResult | null>;
    activeTabContent: TemplateResult | typeof nothing;
    setSearchTerm: (term: string) => void;
    handleKeyEvent: (event: KeyboardEvent) => void;
    close: () => void;
    closeWhenClickingOutsideDialog: (event: MouseEvent) => void;
    selectTab: (tab: UniversalSearchTab) => void;
};

export function renderUniversalSearchView(options: UniversalSearchViewOptions) {
    const localization = getRelewiseUISearchOptions()?.localization;
    const searchBarLocalization = localization?.searchBar;
    const universalSearchLocalization = localization?.universalSearch;

    return html`
        <div class="rw-backdrop" part="backdrop" @click=${options.closeWhenClickingOutsideDialog}>
            <section
                class="rw-dialog"
                part="dialog"
                role="dialog"
                aria-modal="true"
                aria-label=${searchBarLocalization?.search ?? 'Search'}>
                <header class="rw-header" part="header">
                    <relewise-search-bar
                        part="search-bar"
                        exportparts="input: search-input, icon: search-icon"
                        .term=${options.term}
                        .setSearchTerm=${options.setSearchTerm}
                        .handleKeyEvent=${options.handleKeyEvent}
                        .placeholder=${searchBarLocalization?.placeholder ?? null}
                        autofocus>
                    </relewise-search-bar>
                    <relewise-button
                        class="rw-close"
                        part="close-button"
                        button-text=${universalSearchLocalization?.close ?? 'Close'}
                        @click=${options.close}>
                    </relewise-button>
                </header>
                <div class="rw-body" part="body">
                    <slot>
                        ${renderUniversalSearchDefaultView(options)}
                    </slot>
                </div>
            </section>
        </div>
    `;
}

function renderUniversalSearchDefaultView(options: UniversalSearchViewOptions) {
    const universalSearchLocalization = getRelewiseUISearchOptions()?.localization?.universalSearch;

    if (!options.term) {
        return html`<p class="rw-empty" part="empty-state">${universalSearchLocalization?.emptyState ?? 'Start typing to search.'}</p>`;
    }

    if (options.tabs.length === 0) {
        return html`<p class="rw-empty" part="empty-state">${universalSearchLocalization?.noEntitiesConfigured ?? 'No universal-search entities configured.'}</p>`;
    }

    return html`
        ${renderUniversalSearchResultsSummary(options)}
        <nav class="rw-tabs" part="tabs" aria-label=${universalSearchLocalization?.tabsLabel ?? 'Search result tabs'}>
            ${options.tabs.includes('products') ? renderUniversalSearchTab(options, 'products', universalSearchLocalization?.products?.tab ?? 'Products') : nothing}
            ${options.tabs.includes('productCategories') ? renderUniversalSearchTab(options, 'productCategories', universalSearchLocalization?.productCategories?.tab ?? 'Categories') : nothing}
            ${options.tabs.includes('content') ? renderUniversalSearchTab(options, 'content', universalSearchLocalization?.content?.tab ?? 'Content') : nothing}
        </nav>
        ${options.activeTabContent}
    `;
}

function renderUniversalSearchTab(options: UniversalSearchViewOptions, tab: UniversalSearchTab, label: string) {
    const result = options.tabResults[tab];

    return html`
        <button
            class="rw-tab"
            part="tab"
            type="button"
            aria-selected=${options.activeTab === tab}
            @click=${() => options.selectTab(tab)}>
            ${label}
            ${result ? html`<span class="rw-tab-count" part="tab-count">${result.hits}</span>` : nothing}
        </button>
    `;
}

function renderUniversalSearchResultsSummary(options: UniversalSearchViewOptions) {
    const localization = getUniversalSearchTabLocalization(options.activeTab);

    return html`
        <div class="rw-results-summary" part="results-summary">
            ${localization?.resultsFor ?? 'Search results for'} <strong>${options.term}</strong>
        </div>
    `;
}
