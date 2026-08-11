import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { getRelewiseUISearchOptions } from '../helpers';
import { RelewiseLitElement } from '../relewise-lit-element';
import { universalSearchLoadMoreStyles } from './universal-search-load-more.styles';

export class UniversalSearchLoadMore extends RelewiseLitElement {
    @property({ type: Number }) loaded = 0;
    @property({ type: Number }) total = 0;
    @property() resultLabel = '';
    @property({ type: Boolean }) loading = false;

    render() {
        if (this.loading) {
            return html`
                <div class="rw-loading" part="loading-state">
                    <relewise-loading-spinner></relewise-loading-spinner>
                </div>
            `;
        }

        if (this.loaded >= this.total) {
            return nothing;
        }

        const localization = getRelewiseUISearchOptions()?.localization?.loadMoreButton;

        return html`
            <div class="rw-load-more" part="load-more">
                <span class="rw-results-shown">
                    ${localization?.showing ?? 'Showing'} ${this.loaded} ${localization?.outOf ?? 'out of'} ${this.total} ${this.resultLabel}
                </span>
                <relewise-button @click=${this.loadMore}>
                    <span>${localization?.loadMore ?? 'Load More'}</span>
                </relewise-button>
            </div>
        `;
    }

    private loadMore(): void {
        this.dispatchEvent(new Event('universal-search-load-more', { bubbles: true, composed: true }));
    }

    static styles = universalSearchLoadMoreStyles;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-universal-search-load-more': UniversalSearchLoadMore;
    }
}
