import { css } from 'lit';
import { theme } from '../../theme';

export const searchComboboxStyles = [
    theme,
    css`
        .rw-search-combobox {
            position: relative;
        }

        .rw-search-bar {
            box-sizing: border-box;
            display: flex;
            align-items: center;
            padding-left: 1em;
            padding-right: 1em;
            border-color: var(--relewise-search-bar-border-color, var(--relewise-color, #eee));
            height: var(--relewise-search-combobox-height, var(--relewise-product-search-bar-height, 3em));
        }

        .rw-search-bar:focus-within {
            border-color: var(--relewise-search-bar-border-color-focused, var(--accent-color));
            --relewise-icon-color: var(--accent-color);
            --relewise-x-icon-color: var(--accent-color);
        }

        .rw-search-bar-input {
            all: unset;
            flex: 1;
            height: 100%;
            min-width: 0;
        }

        .rw-search-bar-input::placeholder {
            color: var(--color);
        }

        .rw-icon {
            align-items: center;
            appearance: none;
            background: transparent;
            border: 0;
            color: inherit;
            cursor: pointer;
            display: flex;
            flex: 0 0 44px;
            height: 44px;
            justify-content: center;
            margin-inline-end: -0.75em;
            padding: 0;
            width: 44px;
        }

        .rw-search-suggestions {
            position: absolute;
            z-index: var(--relewise-search-suggestions-z-index, 999);
            top: calc(100% + var(--relewise-search-suggestions-offset, 0.25em));
            right: 0;
            left: 0;
            overflow: hidden;
            background: var(--relewise-search-suggestions-background-color, white);
            border: var(--border);
            border-color: var(--relewise-search-suggestions-border-color, #ddd);
            border-radius: var(--relewise-search-suggestions-border-radius, var(--border-radius));
            box-shadow: var(--relewise-search-suggestions-box-shadow, 0 10px 15px rgb(0 0 0 / 0.2));
        }

        .rw-search-suggestions-list {
            list-style: none;
            margin: 0;
            padding: 0;
        }

        .rw-search-suggestion {
            appearance: none;
            align-items: center;
            background: transparent;
            border: 0;
            color: inherit;
            cursor: pointer;
            display: flex;
            font: inherit;
            gap: var(--relewise-search-suggestion-gap, 1em);
            padding: var(--relewise-search-suggestion-padding, 0.5em 1em);
            text-align: left;
            width: 100%;
        }

        .rw-suggestion-icon {
            flex: none;
            margin-left: auto;
            --relewise-icon-color: var(--relewise-search-suggestion-icon-color, var(--accent-color));
        }

        .rw-search-suggestion:hover,
        .rw-search-suggestion[data-selected] {
            background: var(--relewise-hover-color, whitesmoke);
        }

        @media (max-width: 768px) {
            .rw-search-suggestions {
                position: static;
                margin-top: var(--relewise-search-suggestions-offset, 0.25em);
            }
        }
    `,
];
