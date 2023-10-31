import { css } from 'lit';

export const theme = css`
  :host {
    --font: var(--relewise-font, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji");
    --color: var(--relewise-color, lightgray);
    --accent-color:var(--relewise-accent-color, #3764e4);

    --relewise-icon-color: var(--color);
    --relewise-x-icon-color: var(--color);
  }

  .rw-button {
    margin: 0;
    padding: 0;
    height: 3.25rem;
    border: 2px solid;
    border-color: var(--accent-color);
    border-radius: 1rem;
    background-color: var(--accent-color);
  }

  .rw-blurring-overlay {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.5);
    z-index: 999;
    display: block;
}
`;