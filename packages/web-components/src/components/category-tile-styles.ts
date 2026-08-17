import { css } from 'lit';
import { theme } from '../theme';

export const categoryTileStyles = [
    theme,
    css`
        :host {
            background-color: var(--relewise-category-tile-background-color, white);
            border: 1px solid var(--relewise-category-tile-border-color, #eee);
            border-radius: var(--relewise-category-tile-border-radius, 0.5em);
            box-shadow: var(--relewise-category-tile-box-shadow, 0 1px rgb(0 0 0 / 0.05));
            clip-path: inset(0 round var(--relewise-category-tile-border-radius, 0.5em));
            font-family: var(--font);
        }

        .rw-category-tile {
            color: inherit;
            display: flex;
            flex-direction: column;
            height: 100%;
            text-decoration: inherit;
        }

        .rw-category-tile:focus-visible {
            outline: 2px solid var(--relewise-focus-outline-color, #000);
            outline-offset: 2px;
        }

        .rw-image-container {
            background-color: var(--relewise-image-background-color, #fff);
            display: flex;
            justify-content: var(--relewise-image-align, center);
            padding: var(--relewise-image-padding, 0);
        }

        .rw-information-container {
            margin: var(--relewise-information-container-margin, 0.5em 0.5em);
        }

        .rw-object-cover {
            height: var(--relewise-image-height, auto);
            max-width: var(--relewise-image-width, 100%);
            object-fit: contain;
        }

        .rw-display-name {
            color: var(--relewise-display-name-color, #212427);
            display: -webkit-box;
            font-size: var(--relewise-display-name-font-size, 1em);
            font-weight: var(--relewise-display-name-font-weight, 500);
            height: calc(var(--relewise-display-name-line-height, 1.05em) * 2);
            justify-content: var(--relewise-display-name-alignment, start);
            letter-spacing: var(--relewise-display-name-letter-spacing, -0.025em);
            line-height: var(--relewise-display-name-line-height, 1);
            margin: var(--relewise-display-name-margin, 0);
            overflow: hidden;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
        }
    `,
];
