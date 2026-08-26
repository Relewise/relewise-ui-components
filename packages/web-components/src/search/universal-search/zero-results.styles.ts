import { css } from 'lit';

export const universalSearchZeroResultsStyles = css`
    .rw-zero-results {
        display: flex;
        align-items: center;
        gap: var(--relewise-universal-search-zero-results-gap, 1em);
        margin: 0 0 var(--relewise-universal-search-zero-results-margin-bottom, var(--relewise-universal-search-tabs-margin-bottom, 1em));
        padding: var(--relewise-universal-search-zero-results-padding, 1.5em);
        border-radius: var(--relewise-universal-search-zero-results-border-radius, 0.5em);
        background: var(--relewise-universal-search-zero-results-background, #f6f6f6);
    }

    .rw-zero-results-icon {
        display: flex;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;
        width: var(--relewise-universal-search-zero-results-icon-size, 2.5em);
        height: var(--relewise-universal-search-zero-results-icon-size, 2.5em);
        border: 1px solid var(--relewise-universal-search-zero-results-icon-border-color, var(--relewise-universal-search-border-color, #ddd));
        border-radius: 50%;
        color: var(--relewise-universal-search-zero-results-icon-color, currentColor);
        background: var(--relewise-universal-search-zero-results-icon-background, white);
    }

    .rw-zero-results-icon relewise-search-icon {
        --relewise-icon-color: currentColor;
        --relewise-icon-width: 1.1em;
        --relewise-icon-height: 1.1em;
    }

    .rw-zero-results-title,
    .rw-zero-results-hint {
        margin: 0;
    }

    .rw-zero-results-title {
        font-size: var(--relewise-universal-search-zero-results-title-font-size, 1.1em);
        line-height: 1.4;
    }

    .rw-zero-results-hint {
        margin-top: var(--relewise-universal-search-zero-results-hint-margin-top, 0.25em);
        color: var(--relewise-universal-search-zero-results-hint-color, #60646c);
        font-size: var(--relewise-universal-search-zero-results-hint-font-size, 0.95em);
        line-height: 1.5;
    }
`;
