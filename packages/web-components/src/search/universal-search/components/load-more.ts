import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { getRelewiseUISearchOptions } from '../../../helpers';
import { RelewiseLitElement } from '../../../relewise-lit-element';
import { universalSearchLoadMoreStyles } from './load-more.styles';

export class UniversalSearchLoadMore extends RelewiseLitElement {
    @property({ type: Number }) loaded = 0;
    @property({ type: Number }) total = 0;
    @property({ type: Number }) offset = 0;
    @property() resultLabel = '';
    @property({ type: Boolean }) loading = false;
    @property() direction: 'next' | 'previous' = 'next';
    @property({ type: Boolean }) showStatus = true;

    render() {
        if (this.loading) {
            return html`
                <div class="rw-loading" part="loading-state">
                    <relewise-loading-spinner></relewise-loading-spinner>
                </div>
            `;
        }

        const hasMore = this.direction === 'previous' ? this.offset > 0 : this.offset + this.loaded < this.total;
        if (!hasMore) {
            return nothing;
        }

        const localization = getRelewiseUISearchOptions()?.localization?.loadMoreButton;
        const buttonLabel = this.direction === 'previous'
            ? localization?.loadPrevious ?? 'Load previous'
            : localization?.loadMore ?? 'Load More';

        return html`
            <div class="rw-load-more" part=${this.direction === 'previous' ? 'load-previous' : 'load-more'}>
                ${this.showStatus ? html`<span class="rw-results-shown">
                    ${localization?.showing ?? 'Showing'} ${this.loaded} ${localization?.outOf ?? 'out of'} ${this.total} ${this.resultLabel}
                </span>` : nothing}
                <relewise-button @click=${this.loadMore}>
                    <span>${buttonLabel}</span>
                </relewise-button>
            </div>
        `;
    }

    private loadMore(): void {
        const eventName = this.direction === 'previous' ? 'universal-search-load-previous' : 'universal-search-load-more';
        this.dispatchEvent(new Event(eventName, { bubbles: true, composed: true }));
    }

    static styles = universalSearchLoadMoreStyles;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-universal-search-load-more': UniversalSearchLoadMore;
    }
}
