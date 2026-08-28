import { css } from 'lit';
import { theme } from '../../../theme';

export const universalSearchLoadMoreStyles = [theme, css`
    :host {
        display: block;
        font-family: var(--font);
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

    :host([direction='previous']) .rw-load-more {
        margin-top: 0;
        margin-bottom: var(--relewise-universal-search-load-previous-margin-bottom, 1em);
    }
`];
