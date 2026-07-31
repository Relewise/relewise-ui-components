import { css } from 'lit';
import { theme } from '../theme';

export const universalSearchStyles = [theme, css`
    :host {
        font-family: var(--font);
        --relewise-universal-search-color: var(--relewise-color, #212427);
    }

    .rw-backdrop {
        position: fixed;
        inset: 0;
        z-index: var(--relewise-universal-search-z-index, 1000);
        background: var(--relewise-universal-search-backdrop-background, rgb(0 0 0 / 0.35));
        display: flex;
        justify-content: center;
        align-items: stretch;
    }

    .rw-dialog {
        background: var(--relewise-universal-search-background, white);
        color: var(--relewise-universal-search-color);
        --color: var(--relewise-universal-search-color);
        width: var(--relewise-universal-search-width, 100%);
        height: var(--relewise-universal-search-height, 100%);
        display: flex;
        flex-direction: column;
    }

    .rw-header {
        display: flex;
        gap: var(--relewise-universal-search-header-gap, 1em);
        align-items: center;
        padding: var(--relewise-universal-search-header-padding, 1em);
        border-bottom: 1px solid var(--relewise-universal-search-border-color, #ddd);
    }

    relewise-search-bar {
        flex: 1;
    }

    .rw-close {
        flex: 0 0 auto;
        height: var(--relewise-product-search-bar-height, 3em);
        margin: 0;
        padding: var(--relewise-universal-search-close-button-padding, 0 0.75em);
        --relewise-button-icon-padding: 0;
        --relewise-button-text-color: var(--relewise-universal-search-color);
    }

    .rw-body {
        flex: 1;
        overflow: auto;
        padding: var(--relewise-universal-search-body-padding, 1em);
    }

    .rw-empty {
        margin: 0;
    }

    .rw-tabs {
        display: flex;
        gap: var(--relewise-universal-search-tabs-gap, 0.5em);
        border-bottom: 1px solid var(--relewise-universal-search-border-color, #ddd);
        margin-bottom: var(--relewise-universal-search-tabs-margin-bottom, 1em);
    }

    .rw-tab {
        appearance: none;
        background: transparent;
        border: 0;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        font: inherit;
        padding: var(--relewise-universal-search-tab-padding, 0.5em 0);
    }

    .rw-tab[aria-selected="true"] {
        border-bottom-color: var(--relewise-universal-search-tab-active-border-color, currentColor);
        font-weight: 600;
    }

    .rw-tab-count {
        margin-left: 0.25em;
        font-size: 0.8em;
    }

    .rw-results-summary {
        margin-bottom: var(--relewise-universal-search-results-summary-margin-bottom, 1em);
    }

    .rw-results-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: var(--relewise-universal-search-layout-gap, 1em);
    }

    .rw-results-layout:has(.rw-facets) {
        grid-template-columns: minmax(10em, var(--relewise-universal-search-facets-width, 18em)) minmax(0, 1fr);
    }

    .rw-results-header {
        display: flex;
        justify-content: space-between;
        gap: 1em;
        align-items: center;
        margin-bottom: var(--relewise-universal-search-results-header-margin-bottom, 1em);
    }

    .rw-results-title {
        font-size: var(--relewise-universal-search-results-title-font-size, 1.1em);
        margin: 0;
    }

    .rw-results-count {
        font-size: 0.9em;
    }

    .rw-product-grid,
    .rw-result-grid {
        display: grid;
        grid-template-columns: repeat(var(--relewise-universal-search-result-columns, var(--relewise-universal-search-product-columns, 5)), minmax(0, 1fr));
        gap: var(--relewise-universal-search-result-grid-gap, var(--relewise-universal-search-product-grid-gap, 1em));
    }

    .rw-loading {
        display: flex;
        justify-content: center;
        padding: var(--relewise-universal-search-loading-padding, 2em 0);
    }

    .rw-load-more {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5em;
        margin-top: var(--relewise-universal-search-load-more-margin-top, 1em);
    }

    @media (max-width: 768px) {
        .rw-header,
        .rw-results-header {
            align-items: stretch;
            flex-direction: column;
        }

        .rw-results-layout:has(.rw-facets) {
            grid-template-columns: minmax(0, 1fr);
        }

        .rw-product-grid,
        .rw-result-grid {
            grid-template-columns: repeat(var(--relewise-universal-search-mobile-result-columns, var(--relewise-universal-search-mobile-product-columns, 2)), minmax(0, 1fr));
        }
    }
`];
