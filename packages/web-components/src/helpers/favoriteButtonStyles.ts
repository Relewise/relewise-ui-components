import { css } from 'lit';

export const favoriteButtonStyles = css`
    :host {
        position: absolute;
        top: var(--relewise-favorite-top, 0.5em);
        right: var(--relewise-favorite-right, 0.5em);
        display: flex;
        z-index: var(--relewise-favorite-zindex, 10);
    }

    .rw-favorite-button {
        border: 0;
        background-color: var(--relewise-favorite-background, rgba(255, 255, 255, 0.9));
        padding: var(--relewise-favorite-padding, 0.35em);
        color: inherit;
        cursor: pointer;
        border-radius: var(--relewise-favorite-border-radius, 9999px);
        box-shadow: var(--relewise-favorite-shadow, 0 1px 4px rgba(0, 0, 0, 0.12));
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease;
    }

    .rw-favorite-button:focus-visible {
        outline: 2px solid var(--relewise-focus-outline-color, #000);
        outline-offset: 2px;
    }
`;
