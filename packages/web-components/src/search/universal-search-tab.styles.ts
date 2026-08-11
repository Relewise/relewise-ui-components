import { css } from 'lit';
import { theme } from '../theme';

export const universalSearchTabStyles = [theme, css`
    :host {
        display: block;
        font-family: var(--font);
    }

    .rw-empty {
        margin: 0;
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

    @media (max-width: 768px) {
        .rw-results-header {
            align-items: stretch;
            flex-direction: column;
        }

        .rw-results-layout:has(.rw-facets) {
            grid-template-columns: minmax(0, 1fr);
        }

        .rw-result-grid {
            grid-template-columns: repeat(var(--relewise-universal-search-mobile-result-columns, var(--relewise-universal-search-mobile-product-columns, 2)), minmax(0, 1fr));
        }
    }
`];
