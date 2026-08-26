import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { QueryKeys, getRelewiseUISearchOptions } from '../../../helpers';
import { RelewiseLitElement } from '../../../relewise-lit-element';
import type { FacetResultContainer } from '../../types';
import { trapFocusInDialog } from '../universal-search-focus';
import { universalSearchFacetsStyles } from './facets.styles';

export const universalSearchFacetsChangedEvent = 'universal-search-facets-changed';
export const universalSearchFacetsDrawerStateChangedEvent = 'universal-search-facets-drawer-state-changed';

export type UniversalSearchFacetsDrawerStateChangedEventDetail = {
    open: boolean;
};

let universalSearchFacetsInstanceId = 0;

export class UniversalSearchFacets extends RelewiseLitElement {
    @property({ type: Object, attribute: 'facets-result' })
    facetResult: FacetResultContainer | null | undefined = null;

    @property({ type: Array, attribute: 'labels' })
    labels: string[] = [];

    @property({ type: Number, attribute: 'total-hits' })
    totalHits?: number;

    @property({ attribute: 'facet-query-key-prefix' })
    facetQueryKeyPrefix: string = QueryKeys.facet;

    @state() private drawerOpen = false;

    private readonly accessibilityId = `relewise-universal-search-facets-${universalSearchFacetsInstanceId++}`;
    private readonly handleWindowKeyDownBound = this.handleWindowKeyDown.bind(this);
    private layoutResizeObserver: ResizeObserver | null = null;

    connectedCallback(): void {
        super.connectedCallback();
        window.addEventListener('keydown', this.handleWindowKeyDownBound, true);
        this.layoutResizeObserver = new ResizeObserver(() => this.closeDrawerForDesktopLayout());
        this.layoutResizeObserver.observe(this);
        void this.updateComplete.then(() => this.closeDrawerForDesktopLayout());
    }

    disconnectedCallback(): void {
        window.removeEventListener('keydown', this.handleWindowKeyDownBound, true);
        this.layoutResizeObserver?.disconnect();
        this.layoutResizeObserver = null;
        this.drawerOpen = false;
        super.disconnectedCallback();
    }

    private get drawerId(): string {
        return `${this.accessibilityId}-drawer`;
    }

    private get titleId(): string {
        return `${this.accessibilityId}-title`;
    }

    private readonly applyFacet = (): void => {
        this.dispatchEvent(new CustomEvent(universalSearchFacetsChangedEvent, {
            bubbles: true,
            composed: true,
        }));
    };

    private readonly openDrawer = (): void => {
        this.drawerOpen = true;
        this.dispatchDrawerStateChanged();
        void this.updateComplete.then(() => this.renderRoot.querySelector<HTMLElement>('.rw-close')?.focus());
    };

    private readonly closeDrawer = (): void => {
        this.setDrawerClosed('.rw-trigger');
    };

    private closeDrawerForDesktopLayout(): void {
        const trigger = this.renderRoot.querySelector<HTMLElement>('.rw-trigger');
        if (!this.drawerOpen || !trigger || getComputedStyle(trigger).display !== 'none') {
            return;
        }

        this.setDrawerClosed('.rw-drawer');
    }

    private setDrawerClosed(focusTargetSelector: string): void {
        if (!this.drawerOpen) {
            return;
        }

        this.drawerOpen = false;
        this.dispatchDrawerStateChanged();
        void this.updateComplete.then(() => this.renderRoot.querySelector<HTMLElement>(focusTargetSelector)?.focus());
    }

    private dispatchDrawerStateChanged(): void {
        this.dispatchEvent(new CustomEvent<UniversalSearchFacetsDrawerStateChangedEventDetail>(universalSearchFacetsDrawerStateChangedEvent, {
            bubbles: true,
            composed: true,
            detail: { open: this.drawerOpen },
        }));
    }

    private handleWindowKeyDown(event: KeyboardEvent): void {
        if (!this.drawerOpen || event.defaultPrevented || event.key !== 'Escape') {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        this.closeDrawer();
    }

    private handleDrawerKeyDown(event: KeyboardEvent): void {
        if (!this.drawerOpen || event.key !== 'Tab') {
            return;
        }

        event.stopPropagation();
        trapFocusInDialog(event, event.currentTarget as HTMLElement);
    }

    render() {
        const localization = getRelewiseUISearchOptions()?.localization;
        const filterLabel = localization?.facets?.filter ?? 'Filters';

        return html`
            <button
                class="rw-trigger"
                part="facet-trigger"
                type="button"
                aria-controls=${this.drawerId}
                aria-expanded=${this.drawerOpen}
                aria-haspopup="dialog"
                @click=${this.openDrawer}>
                <relewise-filter-icon aria-hidden="true"></relewise-filter-icon>
                ${filterLabel}
            </button>
            ${this.drawerOpen ? html`
                <div
                    class="rw-backdrop"
                    part="facet-drawer-backdrop"
                    @click=${this.closeDrawer}>
                </div>
            ` : nothing}
            <aside
                id=${this.drawerId}
                class="rw-drawer"
                part="facet-panel facet-drawer"
                role=${this.drawerOpen ? 'dialog' : nothing}
                aria-modal=${this.drawerOpen ? 'true' : nothing}
                aria-labelledby=${this.titleId}
                tabindex="-1"
                @keydown=${this.handleDrawerKeyDown}
                ?open=${this.drawerOpen}>
                <header class="rw-drawer-header" part="facet-drawer-header">
                    <h2 id=${this.titleId} class="rw-drawer-title">${filterLabel}</h2>
                    <button
                        class="rw-close"
                        part="facet-drawer-close"
                        type="button"
                        @click=${this.closeDrawer}>
                        ${localization?.universalSearch?.close ?? 'Close'}
                    </button>
                </header>
                <relewise-facets
                    expanded
                    exportparts="container: facet-container, title: facet-title, input: facet-input, label: facet-label, value: facet-value, hits: facet-hits"
                    .labels=${this.labels}
                    .facetQueryKeyPrefix=${this.facetQueryKeyPrefix}
                    .applyFacet=${this.applyFacet}
                    .facetResult=${this.facetResult}
                    .totalHits=${this.totalHits}>
                </relewise-facets>
            </aside>
        `;
    }

    static styles = universalSearchFacetsStyles;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-universal-search-facets': UniversalSearchFacets;
    }
}
