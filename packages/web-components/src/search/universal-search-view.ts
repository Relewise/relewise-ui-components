import { html, nothing } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { getRelewiseUISearchOptions } from '../helpers';
import type { TemplateResult } from 'lit';
import type { UniversalSearchEntity } from './universal-search-entity-registry';
import type { UniversalSearchTab } from './universal-search.types';

export type UniversalSearchViewOptions = {
    term: string;
    entities: UniversalSearchEntity[];
    activeTab: UniversalSearchTab | null;
    activeTabContent: TemplateResult | typeof nothing;
    activeTabContentKey: string;
    accessibilityId: string;
    setSearchTerm: (term: string) => void;
    handleKeyEvent: (event: KeyboardEvent) => void;
    close: () => void;
    closeWhenClickingOutsideDialog: (event: MouseEvent) => void;
    handleDialogKeyDown: (event: KeyboardEvent) => void;
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
                tabindex="-1"
                @keydown=${options.handleDialogKeyDown}
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
                    ${renderUniversalSearchDefaultView(options)}
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

    if (options.entities.length === 0) {
        return html`<p class="rw-empty" part="empty-state">${universalSearchLocalization?.noEntitiesConfigured ?? 'No universal-search entities configured.'}</p>`;
    }

    return html`
        ${renderUniversalSearchResultsSummary(options)}
        <nav class="rw-tabs" part="tabs" role="tablist" aria-label=${universalSearchLocalization?.tabsLabel ?? 'Search result tabs'}>
            ${options.entities.map(entity => renderUniversalSearchTab(options, entity))}
        </nav>
        ${options.activeTab ? html`
            <div
                id=${getPanelId(options, options.activeTab)}
                role="tabpanel"
                aria-labelledby=${getTabId(options, options.activeTab)}
                tabindex="0">
                ${keyed(options.activeTabContentKey, options.activeTabContent)}
            </div>
        ` : nothing}
    `;
}

function renderUniversalSearchTab(options: UniversalSearchViewOptions, entity: UniversalSearchEntity) {
    return html`
        <button
            class="rw-tab"
            part="tab"
            type="button"
            id=${getTabId(options, entity.id)}
            role="tab"
            aria-controls=${getPanelId(options, entity.id)}
            aria-selected=${options.activeTab === entity.id}
            tabindex=${options.activeTab === entity.id ? 0 : -1}
            @keydown=${(event: KeyboardEvent) => handleTabKeyDown(event, options, entity.id)}
            @click=${() => options.selectTab(entity.id)}>
            ${entity.tabLabel}
            ${entity.response ? html`<span class="rw-tab-count" part="tab-count">${entity.response.hits}</span>` : nothing}
        </button>
    `;
}

function handleTabKeyDown(event: KeyboardEvent, options: UniversalSearchViewOptions, tab: UniversalSearchTab): void {
    const tabs = options.entities.map(entity => entity.id);
    const currentIndex = tabs.indexOf(tab);
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % tabs.length;
    } else if (event.key === 'ArrowLeft') {
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (event.key === 'Home') {
        nextIndex = 0;
    } else if (event.key === 'End') {
        nextIndex = tabs.length - 1;
    }

    if (nextIndex === null) {
        return;
    }

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    options.selectTab(nextTab);
    const tabList = (event.currentTarget as HTMLElement).parentElement;
    tabList?.querySelector<HTMLElement>(`#${getTabId(options, nextTab)}`)?.focus();
}

function getTabId(options: UniversalSearchViewOptions, tab: UniversalSearchTab): string {
    return `${options.accessibilityId}-tab-${tab}`;
}

function getPanelId(options: UniversalSearchViewOptions, tab: UniversalSearchTab): string {
    return `${options.accessibilityId}-panel-${tab}`;
}

function renderUniversalSearchResultsSummary(options: UniversalSearchViewOptions) {
    const activeEntity = options.entities.find(entity => entity.id === options.activeTab);

    return html`
        <div class="rw-results-summary" part="results-summary">
            ${activeEntity?.resultsForLabel ?? 'Search results for'} <strong>${options.term}</strong>
        </div>
    `;
}
