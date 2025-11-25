import { css } from 'lit';

export const sentimentButtonStyles = css`
    :host {
        display: block;
        z-index: var(--relewise-sentiment-zindex, 10);
    }

    .rw-sentiment-actions {
        display: flex;
        gap: var(--relewise-sentiment-button-gap, 0.5em);
        padding: var(--relewise-sentiment-padding, 0 0.5em 0.5em 0.5em);
        justify-content: flex-end;
    }

    .rw-sentiment-button {
        border: 0;
        border-radius: var(--relewise-sentiment-border-radius, 9999px);
        background-color: var(--relewise-sentiment-background, transparent);
        color: inherit;
        cursor: pointer;
        padding: var(--relewise-sentiment-button-padding, 0.35em);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s ease, color 0.2s ease;
    }

    .rw-sentiment-button[aria-pressed='true'],
    .rw-sentiment-button:hover {
        background-color: var(--relewise-sentiment-active-background, rgba(0, 0, 0, 0.05));
        color: var(--relewise-sentiment-active-color, inherit);
    }

    .rw-sentiment-button:focus-visible {
        outline: 2px solid var(--relewise-focus-outline-color, #000);
        outline-offset: 2px;
    }
`;
