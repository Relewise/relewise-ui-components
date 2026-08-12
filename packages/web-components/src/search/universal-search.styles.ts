import { css } from 'lit';
import { theme } from '../theme';

export const universalSearchStyles = [theme, css`
    :host {
        display: block;
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

    .rw-recommendation-blocks {
        display: grid;
        gap: var(--relewise-universal-search-recommendation-block-gap, 2em);
    }

    .rw-recommendation-title {
        margin: 0 0 var(--relewise-universal-search-recommendation-title-margin-bottom, 1em);
    }

    .rw-recommendation-grid {
        display: grid;
        grid-template-columns: repeat(var(--relewise-universal-search-recommendation-grid-columns, 4), minmax(0, 1fr));
        gap: var(--relewise-universal-search-recommendation-grid-gap, 1em);
    }

    .rw-recommendation-loading {
        display: flex;
        justify-content: center;
    }

    .rw-recommendation-terms {
        display: flex;
        flex-wrap: wrap;
        gap: var(--relewise-universal-search-recommendation-term-gap, 0.5em);
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .rw-recommendation-term {
        background: var(--relewise-universal-search-recommendation-term-background, white);
        border: 1px solid var(--relewise-universal-search-border-color, #ddd);
        border-radius: var(--relewise-universal-search-recommendation-term-border-radius, 1em);
        color: inherit;
        cursor: pointer;
        font: inherit;
        min-height: 2.75em;
        padding: var(--relewise-universal-search-recommendation-term-padding, 0.5em 0.75em);
    }

    @media (max-width: 768px) {
        .rw-header {
            align-items: stretch;
            flex-direction: column;
        }

        relewise-search-combobox {
            width: 100%;
        }

        .rw-recommendation-grid {
            grid-template-columns: repeat(var(--relewise-universal-search-recommendation-grid-mobile-columns, 2), minmax(0, 1fr));
        }
    }
`];
