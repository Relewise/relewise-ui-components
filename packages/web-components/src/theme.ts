import { css } from 'lit';

export const theme = css`
  :host {
    --font: var(--relewise-font, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji");
    --color: var(--relewise-color, lightgray);
    --accent-color:var(--relewise-accent-color, #3764e4);

    --relewise-search-icon-color: var(--color);
    --relewise-x-icon-color: var(--color);
  }
`;