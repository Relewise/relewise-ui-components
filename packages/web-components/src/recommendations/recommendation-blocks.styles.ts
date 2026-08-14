import { css } from 'lit';
import { theme } from '../theme';

export const recommendationBlockStyles = [theme, css`
    :host {
        display: block;
        font-family: var(--font);
    }

    .rw-recommendation-blocks {
        display: grid;
        gap: var(--relewise-recommendation-block-gap, 2em);
    }

    .rw-recommendation-title {
        margin: 0 0 var(--relewise-recommendation-title-margin-bottom, 1em);
    }

    .rw-recommendation-grid {
        display: grid;
        grid-template-columns: repeat(var(--relewise-recommendation-grid-columns, 4), minmax(0, 1fr));
        gap: var(--relewise-recommendation-grid-gap, 1em);
    }

    .rw-recommendation-loading {
        display: flex;
        justify-content: center;
    }

    .rw-recommendation-terms {
        display: flex;
        flex-wrap: wrap;
        gap: var(--relewise-recommendation-term-gap, 0.5em);
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .rw-recommendation-term {
        background: var(--relewise-recommendation-term-background, white);
        border: 1px solid var(--relewise-recommendation-term-border-color, #ddd);
        border-radius: var(--relewise-recommendation-term-border-radius, 1em);
        color: inherit;
        cursor: pointer;
        font: inherit;
        min-height: 2.75em;
        padding: var(--relewise-recommendation-term-padding, 0.5em 0.75em);
    }

    @media (max-width: 768px) {
        .rw-recommendation-grid {
            grid-template-columns: repeat(var(--relewise-recommendation-grid-mobile-columns, 2), minmax(0, 1fr));
        }
    }
`];
