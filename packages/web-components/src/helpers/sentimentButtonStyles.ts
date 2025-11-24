import { css } from 'lit';

export const sentimentButtonStyles = css`
    :host {
        display: block;
    }

    .rw-engagement-actions {
        display: flex;
        gap: var(--relewise-engagement-button-gap, 0.5em);
        padding: var(--relewise-engagement-padding, 0 0.5em 0.5em 0.5em);
        justify-content: flex-end;
    }

    .rw-engagement-button {
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

    .rw-engagement-button[aria-pressed='true'],
    .rw-engagement-button:hover {
        background-color: var(--relewise-engagement-active-background, rgba(0, 0, 0, 0.05));
        color: var(--relewise-engagement-active-color, inherit);
    }

    .rw-engagement-button:focus-visible {
        outline: 2px solid var(--relewise-focus-outline-color, #000);
        outline-offset: 2px;
    }
`;
