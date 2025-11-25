import { css } from 'lit';

export const sentimentButtonStyles = css`
    :host {
        display: block;
        z-index: var(--relewise-engagement-zindex, 10);
    }

    .rw-sentiment-actions {
        display: flex;
        gap: var(--relewise-engagement-button-gap, 0.5em);
        padding: var(--relewise-engagement-padding, 0 0.5em 0.5em 0.5em);
        justify-content: flex-end;
    }

    .rw-sentiment-button {
        border: 0;
        border-radius: var(--relewise-engagement-border-radius, 9999px);
        background-color: var(--relewise-engagement-background, transparent);
        color: inherit;
        cursor: pointer;
        padding: var(--relewise-engagement-button-padding, 0.35em);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s ease, color 0.2s ease;
    }

    .rw-sentiment-button[aria-pressed='true'],
    .rw-sentiment-button:hover {
        background-color: var(--relewise-engagement-active-background, rgba(0, 0, 0, 0.05));
        color: var(--relewise-engagement-active-color, inherit);
    }

    .rw-sentiment-button:focus-visible {
        outline: 2px solid var(--relewise-focus-outline-color, #000);
        outline-offset: 2px;
    }
`;
