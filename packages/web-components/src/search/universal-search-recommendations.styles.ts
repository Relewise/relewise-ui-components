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
        gap: var(--relewise-universal-search-recommendation-block-gap, 2em);
    }

    .rw-recommendation-title {
        margin: 0 0 var(--relewise-universal-search-recommendation-title-margin-bottom, 1em);
    }

    .rw-recommendation-loading {
        display: flex;
        justify-content: center;
    }

`];
