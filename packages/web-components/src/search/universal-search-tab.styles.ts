import { css } from 'lit';
import { theme } from '../theme';
import { universalSearchZeroResultsStyles } from './universal-search-zero-results.styles';

export const universalSearchTabStyles = [theme, universalSearchZeroResultsStyles, css`
    :host {
        display: block;
        font-family: var(--font);
        min-width: 0;
    }

    .rw-empty {
        margin: 0;
    }

    .rw-results-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: var(--relewise-universal-search-layout-gap, 1em);
        margin-inline: auto;
        max-width: min(100%, var(--relewise-universal-search-mobile-results-width, var(--relewise-universal-search-results-width, 100%)));
        position: relative;
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

    .rw-product-results-layout {
        grid-template-areas:
            "facets facets"
            "header sorting"
            "results results";
        grid-template-columns: minmax(0, 1fr) auto;
    }

    .rw-product-results-layout:not(:has(.rw-facets)) {
        grid-template-areas:
            "header sorting"
            "results results";
    }

    .rw-product-results-layout:not(:has(.rw-results-header)):not(:has(.rw-sorting)) {
        grid-template-areas: "results results";
    }

    .rw-product-results-layout .rw-facets {
        grid-area: facets;
    }

    .rw-product-results-layout .rw-results-header {
        grid-area: header;
        margin-bottom: 0;
    }

    .rw-product-results-layout .rw-sorting {
        align-self: center;
        grid-area: sorting;
        position: relative;
    }

    .rw-product-results-layout .rw-results {
        grid-area: results;
    }

    .rw-sorting relewise-product-search-sorting::part(label) {
        clip: rect(0 0 0 0);
        clip-path: inset(50%);
        height: 1px;
        overflow: hidden;
        position: absolute;
        white-space: nowrap;
        width: 1px;
    }

    .rw-sorting relewise-product-search-sorting::part(select) {
        appearance: none;
        padding-inline-end: var(--relewise-universal-search-sorting-arrow-space, 2.25em);
        text-align-last: center;
    }

    .rw-sorting-chevron {
        border-bottom: 0.14em solid currentColor;
        border-right: 0.14em solid currentColor;
        height: 0.45em;
        inset-inline-end: var(--relewise-universal-search-sorting-arrow-inset, 0.8em);
        pointer-events: none;
        position: absolute;
        top: 50%;
        transform: translateY(-70%) rotate(45deg);
        width: 0.45em;
    }

    .rw-result-grid {
        display: grid;
        grid-template-columns: repeat(var(--relewise-universal-search-result-columns, var(--relewise-universal-search-product-columns, 5)), minmax(0, 1fr));
        gap: var(--relewise-universal-search-result-grid-gap, var(--relewise-universal-search-product-grid-gap, 1em));
    }

    .rw-product-grid {
        grid-template-columns: repeat(var(--relewise-universal-search-product-columns, var(--relewise-universal-search-result-columns, 5)), minmax(0, 1fr));
    }

    .rw-category-grid {
        grid-template-columns: repeat(var(--relewise-universal-search-category-columns, var(--relewise-universal-search-result-columns, var(--relewise-universal-search-product-columns, 5))), minmax(0, 1fr));
    }

    .rw-content-grid {
        grid-template-columns: repeat(var(--relewise-universal-search-content-columns, var(--relewise-universal-search-result-columns, var(--relewise-universal-search-product-columns, 5))), minmax(0, 1fr));
    }

    .rw-results,
    .rw-result-grid > * {
        max-width: 100%;
        min-width: 0;
    }

    .rw-loading {
        display: flex;
        justify-content: center;
        padding: var(--relewise-universal-search-loading-padding, 2em 0);
    }

    @container universal-search-dialog (width < 64rem) {
        .rw-results-layout {
            position: static;
        }

        .rw-result-grid {
            grid-template-columns: repeat(var(--relewise-universal-search-mobile-result-columns, var(--relewise-universal-search-mobile-product-columns, 2)), minmax(0, 1fr));
        }

        .rw-product-grid {
            grid-template-columns: repeat(var(--relewise-universal-search-mobile-product-columns, var(--relewise-universal-search-mobile-result-columns, 2)), minmax(0, 1fr));
        }

        .rw-category-grid {
            grid-template-columns: repeat(var(--relewise-universal-search-mobile-category-columns, var(--relewise-universal-search-mobile-result-columns, var(--relewise-universal-search-mobile-product-columns, 2))), minmax(0, 1fr));
        }

        .rw-content-grid {
            grid-template-columns: repeat(var(--relewise-universal-search-mobile-content-columns, var(--relewise-universal-search-mobile-result-columns, var(--relewise-universal-search-mobile-product-columns, 2))), minmax(0, 1fr));
        }
    }

    @container universal-search-dialog (width <= 48rem) {
        .rw-results-header {
            align-items: stretch;
            flex-direction: column;
        }

        .rw-facets {
            width: 100%;
        }

        .rw-product-results-layout:has(.rw-facets):has(.rw-sorting) {
            grid-template-areas:
                "facets sorting"
                "header header"
                "results results";
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .rw-product-results-layout:has(.rw-facets):not(:has(.rw-sorting)) {
            grid-template-areas:
                "facets"
                "header"
                "results";
            grid-template-columns: minmax(0, 1fr);
        }

        .rw-product-results-layout:has(.rw-sorting):not(:has(.rw-facets)) {
            grid-template-areas:
                "sorting"
                "header"
                "results";
            grid-template-columns: minmax(0, 1fr);
        }

        .rw-product-results-layout .rw-sorting {
            height: 2.75em;
            min-width: 0;
            width: 100%;
        }

        .rw-sorting relewise-product-search-sorting {
            display: block;
            height: 100%;
            width: 100%;
        }

        .rw-sorting relewise-product-search-sorting::part(container) {
            display: flex;
            height: 100%;
            width: 100%;
        }

        .rw-sorting relewise-product-search-sorting::part(select) {
            flex: 1;
            height: 100%;
            min-width: 0;
        }
    }

    @container universal-search-dialog (width >= 64rem) {
        .rw-results-layout {
            max-width: min(100%, var(--relewise-universal-search-results-width, 100%));
        }

        .rw-results-layout:has(.rw-facets) {
            grid-template-columns: minmax(10em, var(--relewise-universal-search-facets-width, 18em)) minmax(0, 1fr);
        }

        .rw-product-results-layout:has(.rw-facets) {
            grid-template-areas:
                "facets header sorting"
                "facets results results";
            grid-template-columns: minmax(10em, var(--relewise-universal-search-facets-width, 18em)) minmax(0, 1fr) auto;
            grid-template-rows: minmax(min-content, 3em) auto;
        }

        .rw-product-results-layout:not(:has(.rw-facets)) {
            grid-template-areas:
                "header sorting"
                "results results";
            grid-template-columns: minmax(0, 1fr) auto;
        }

        .rw-product-results-layout:not(:has(.rw-results-header)):not(:has(.rw-sorting)) {
            grid-template-areas: "results results";
        }
    }
`];
