import { css } from 'lit';
import { theme } from '../theme';

export const universalSearchRecommendationsStyles = [theme, css`
    :host {
        display: block;
        font-family: var(--font);
    }

    .rw-recommendation-blocks,
    relewise-product-recommendation-batcher {
        display: grid;
        gap: var(--relewise-recommendation-block-gap, 2em);
    }

    .rw-recommendation-title {
        margin: 0 0 var(--relewise-recommendation-title-margin-bottom, 1em);
    }

    .rw-recommendation-loading {
        display: flex;
        justify-content: center;
    }

    relewise-popular-search-terms {
        --relewise-popular-search-terms-gap: var(--relewise-recommendation-term-gap, 0.5em);
        --relewise-popular-search-term-background: var(--relewise-recommendation-term-background, white);
        --relewise-popular-search-term-border-color: var(--relewise-recommendation-term-border-color, #ddd);
        --relewise-popular-search-term-border-radius: var(--relewise-recommendation-term-border-radius, 1em);
        --relewise-popular-search-term-padding: var(--relewise-recommendation-term-padding, 0.5em 0.75em);
    }
`];
