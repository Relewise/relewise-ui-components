import { css } from 'lit';

export const theme = css`
  :host {
    --font: var(--relewise-font, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji");
    --color: var(--relewise-color, #eee);
    --accent-color:var(--relewise-accent-color, #3764e4);

    --relewise-icon-color: var(--color);
    --relewise-x-icon-color: var(--color);
    --border-radius: var(--relewise-border-radius, 1rem);
    --border: var(--relewise-border, 2px solid)
  }

  .rw-button {
    margin: 0;
    padding: 0;
    font-family: var(--font);
    height: var(--relewise-button-height, 3rem);
    border: var(--border);
    border-radius: var(--border-radius);
    border-color: var(--accent-color);
    background-color: var(--accent-color);
    font-size: .85rem;
  }

  .rw-border {
    border: var(--border);
    border-radius: var(--border-radius)
  }

  .rw-dimming-overlay {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.5);
    z-index: 999;
    display: block;
  }
`;