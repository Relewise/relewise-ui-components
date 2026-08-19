import { css } from 'lit';
import { theme } from '../theme';

export const universalSearchStyles = [theme, css`
    :host {
        display: block;
        font-family: var(--font);
        --relewise-universal-search-color: var(--relewise-color, #212427);
        --relewise-popular-search-term-border-color: var(--relewise-universal-search-border-color, #ddd);
        --relewise-recommendation-grid-columns: var(--relewise-universal-search-result-columns, var(--relewise-universal-search-product-columns, 5));
        --relewise-recommendation-grid-mobile-columns: var(--relewise-universal-search-mobile-result-columns, var(--relewise-universal-search-mobile-product-columns, 2));
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
        border-bottom: 1px solid var(--relewise-universal-search-border-color, var(--relewise-checklist-facet-border-color, #eee));
    }

    relewise-search-combobox {
        display: block;
        flex: 1;
        min-width: 0;
    }

    .rw-close {
        flex: 0 0 auto;
        height: var(--relewise-search-combobox-height, var(--relewise-product-search-bar-height, 3em));
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
        gap: var(--relewise-universal-search-tabs-gap, 1.5em);
        border-bottom: 1px solid var(--relewise-universal-search-border-color, var(--relewise-checklist-facet-border-color, #eee));
        padding-top: var(--relewise-universal-search-tabs-padding-top, 0.5em);
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

    .rw-global-zero-results {
        margin-bottom: var(--relewise-universal-search-results-summary-margin-bottom, 1em);
    }

    @media (max-width: 768px) {
        .rw-header {
            align-items: stretch;
            flex-direction: column;
        }

        relewise-search-combobox {
            width: 100%;
        }
    }
`];
