import { css } from 'lit';
import { theme } from '../theme';

export const universalSearchFacetsStyles = [theme, css`
    :host {
        display: block;
        font-family: var(--font);
        min-width: 0;
    }

    .rw-trigger,
    .rw-close {
        appearance: none;
        background: var(--relewise-universal-search-background, white);
        border: 1px solid var(--relewise-universal-search-border-color, var(--relewise-checklist-facet-border-color, #eee));
        border-radius: var(--relewise-border-radius, 0.5em);
        box-sizing: border-box;
        color: inherit;
        cursor: pointer;
        font: inherit;
        min-height: 2.75em;
        padding: 0.5em 0.75em;
    }

    .rw-trigger {
        align-items: center;
        display: inline-flex;
        gap: 0.5em;
        justify-content: center;
        width: 100%;
    }

    .rw-trigger relewise-filter-icon {
        flex: none;
        width: 1em;
        --relewise-icon-color: currentColor;
    }

    .rw-backdrop {
        background: var(--relewise-universal-search-backdrop-background, rgb(0 0 0 / 0.35));
        inset: 0;
        position: absolute;
        z-index: 1;
    }

    .rw-drawer {
        background: var(--relewise-universal-search-background, white);
        box-sizing: border-box;
        display: none;
        height: 100%;
        inset-block: 0;
        inset-inline: 0;
        max-width: 100%;
        overscroll-behavior: contain;
        overflow: auto;
        padding: 1em;
        position: absolute;
        width: 100%;
        z-index: 2;
    }

    .rw-drawer[open] {
        display: block;
    }

    .rw-drawer-header {
        align-items: center;
        display: flex;
        gap: 1em;
        justify-content: space-between;
        margin-inline: auto;
        margin-bottom: 1em;
        max-width: min(100%, var(--relewise-universal-search-mobile-facet-content-width, var(--relewise-universal-search-mobile-facet-drawer-width, var(--relewise-universal-search-facet-drawer-width, 24em))));
    }

    .rw-drawer-title {
        font-size: 1.1em;
        font-weight: 600;
        margin: 0;
        overflow-wrap: anywhere;
    }

    relewise-facets {
        display: block;
        margin-inline: auto;
        max-width: min(100%, var(--relewise-universal-search-mobile-facet-content-width, var(--relewise-universal-search-mobile-facet-drawer-width, var(--relewise-universal-search-facet-drawer-width, 24em))));
        min-width: 0;
        width: 100%;
    }

    @container universal-search-dialog (width >= 64rem) {
        .rw-trigger,
        .rw-backdrop,
        .rw-drawer-header {
            display: none;
        }

        .rw-drawer,
        .rw-drawer[open] {
            background: transparent;
            display: block;
            height: auto;
            inset: auto;
            max-width: none;
            overflow: visible;
            padding: 0;
            position: static;
            width: auto;
        }

        relewise-facets {
            margin-inline: 0;
            max-width: none;
            width: auto;
        }
    }
`];
