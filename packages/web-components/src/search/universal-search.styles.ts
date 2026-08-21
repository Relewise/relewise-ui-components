import { css } from 'lit';
import { theme } from '../theme';
import { universalSearchZeroResultsStyles } from './universal-search-zero-results.styles';

export const universalSearchStyles = [theme, universalSearchZeroResultsStyles, css`
    :host {
        display: block;
        font-family: var(--font);
        --relewise-universal-search-color: var(--relewise-color, #212427);
        --relewise-popular-search-term-border-color: var(--relewise-universal-search-border-color, #ddd);
        --relewise-recommendation-grid-columns: var(--relewise-universal-search-result-columns, var(--relewise-universal-search-product-columns, 5));
        --relewise-recommendation-grid-mobile-columns: var(--relewise-universal-search-mobile-result-columns, var(--relewise-universal-search-mobile-product-columns, 2));
    }

    *,
    *::before,
    *::after {
        box-sizing: border-box;
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
        container: universal-search-dialog / inline-size;
        width: min(100%, var(--relewise-universal-search-width, 100%));
        height: min(100dvh, var(--relewise-universal-search-height, 100%));
        max-height: 100dvh;
        display: flex;
        flex-direction: column;
        min-width: 0;
        position: relative;
    }

    .rw-header {
        display: flex;
        gap: 0;
        align-items: center;
        padding: var(--relewise-universal-search-header-padding, 1em);
        padding-inline-end: 0;
        padding-inline-start: var(--relewise-universal-search-header-gap, 1em);
        border-bottom: 1px solid var(--relewise-universal-search-border-color, var(--relewise-checklist-facet-border-color, #eee));
    }

    relewise-search-combobox {
        display: block;
        flex: 1;
        max-width: min(100%, var(--relewise-universal-search-search-width, 100%));
        min-width: 0;
        width: min(100%, var(--relewise-universal-search-search-width, 100%));
    }

    .rw-close {
        flex: 0 0 auto;
        height: var(--relewise-search-combobox-height, var(--relewise-product-search-bar-height, 3em));
        margin: 0;
        padding: var(--relewise-universal-search-close-button-padding, 0 0.75em);
        padding-inline: var(--relewise-universal-search-header-gap, 1em);
        --relewise-button-icon-padding: 0;
        --relewise-button-text-color: var(--relewise-universal-search-color);
    }

    .rw-body {
        flex: 1;
        min-width: 0;
        overflow: auto;
        overscroll-behavior: contain;
        padding: var(--relewise-universal-search-body-padding, 1em);
        position: relative;
    }

    .rw-body > * {
        margin-inline: auto;
        max-width: min(100%, var(--relewise-universal-search-layout-width, 100%));
    }

    .rw-empty {
        margin: 0;
    }

    .rw-tabs {
        display: flex;
        gap: var(--relewise-universal-search-tabs-gap, 1.5em);
        border-bottom: 1px solid var(--relewise-universal-search-border-color, var(--relewise-checklist-facet-border-color, #eee));
        max-width: min(100%, var(--relewise-universal-search-tabs-width, 100%));
        overflow-x: auto;
        padding-top: var(--relewise-universal-search-tabs-padding-top, 0.5em);
        margin-bottom: var(--relewise-universal-search-tabs-margin-bottom, 1em);
    }

    .rw-tab {
        appearance: none;
        background: transparent;
        border: 0;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        flex: none;
        font: inherit;
        padding: var(--relewise-universal-search-tab-padding, 0.5em 0);
        white-space: nowrap;
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
        overflow-wrap: anywhere;
    }

    @container universal-search-dialog (width < 64rem) {
        .rw-body.rw-facets-open {
            overflow: hidden;
        }

        .rw-header {
            padding-inline-start: var(--relewise-universal-search-mobile-header-spacing, var(--relewise-universal-search-header-gap, 0.75em));
        }

        .rw-close {
            padding-inline: var(--relewise-universal-search-mobile-header-spacing, var(--relewise-universal-search-header-gap, 0.75em));
        }

        .rw-body > * {
            max-width: min(100%, var(--relewise-universal-search-mobile-layout-width, var(--relewise-universal-search-layout-width, 100%)));
        }

        .rw-tabs {
            flex-wrap: wrap;
            gap: var(--relewise-universal-search-mobile-tabs-gap, 0.75em);
            justify-content: safe center;
            max-width: min(100%, var(--relewise-universal-search-mobile-tabs-width, var(--relewise-universal-search-tabs-width, 100%)));
            overflow-x: visible;
        }

        .rw-tab {
            flex: 0 1 auto;
            max-width: 100%;
            min-width: 0;
            overflow-wrap: anywhere;
            white-space: normal;
        }

        .rw-results-summary {
            margin-block: var(--relewise-universal-search-results-summary-spacing, var(--relewise-universal-search-results-summary-margin-bottom, 1em));
            text-align: center;
        }
    }

    @container universal-search-dialog (width <= 48rem) {
        .rw-header {
            align-items: flex-start;
        }

        relewise-search-combobox {
            flex: 1 1 auto;
            max-width: min(100%, var(--relewise-universal-search-mobile-search-width, var(--relewise-universal-search-search-width, 100%)));
            width: auto;
        }

        relewise-search-combobox::part(search-suggestions) {
            margin-top: var(--relewise-search-suggestions-offset, 0.25em);
            position: static;
        }
    }

    @media (max-width: 48rem) {
        .rw-dialog {
            width: min(100%, var(--relewise-universal-search-mobile-width, var(--relewise-universal-search-width, 100%)));
            height: min(100dvh, var(--relewise-universal-search-mobile-height, var(--relewise-universal-search-height, 100%)));
        }

        .rw-header {
            padding-top: max(var(--relewise-universal-search-header-padding, 1em), env(safe-area-inset-top));
            padding-inline-end: 0;
            padding-inline-start: max(var(--relewise-universal-search-mobile-header-spacing, var(--relewise-universal-search-header-gap, 0.75em)), env(safe-area-inset-left));
        }

        .rw-close {
            padding-inline-end: max(var(--relewise-universal-search-mobile-header-spacing, var(--relewise-universal-search-header-gap, 0.75em)), env(safe-area-inset-right));
        }

        .rw-body {
            padding-right: max(var(--relewise-universal-search-body-padding, 1em), env(safe-area-inset-right));
            padding-bottom: max(var(--relewise-universal-search-body-padding, 1em), env(safe-area-inset-bottom));
            padding-left: max(var(--relewise-universal-search-body-padding, 1em), env(safe-area-inset-left));
        }
    }
`];
