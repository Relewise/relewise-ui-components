import { ContentResult, User } from '@relewise/client';
import { LitElement, adoptStyles, css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { templateHelpers } from '../helpers/templateHelpers';
import { theme } from '../theme';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { until } from 'lit-html/directives/until.js';

export class ContentTile extends LitElement {

    @property({ type: Object })
    content: ContentResult | null = null;

    @property({ type: Object })
    private user: User | null = null;

    // Override Lit's shadow root creation and only attach default styles when no template override exists.
    protected createRenderRoot(): HTMLElement | DocumentFragment {
        const root = super.createRenderRoot();

        if (root instanceof ShadowRoot) {
            let hasCustomTemplate = false;
            try {
                const settings = getRelewiseUIOptions();
                hasCustomTemplate = Boolean(settings.templates?.content);
            } catch (error) {
                console.error('Relewise: Error initializing initializeRelewiseUI. Keeping default styles, ', error);
            }

            if (!hasCustomTemplate) {
                adoptStyles(root, ContentTile.defaultStyles);
            }
        }

        return root;
    }

    connectedCallback() {
        super.connectedCallback();
    }

    render() {
        if (!this.content) {
            return;
        }

        const settings = getRelewiseUIOptions();
        if (settings.templates?.content) {
            const result = settings.templates.content(this.content, { html, helpers: { ...templateHelpers, unsafeHTML, nothing } });
            const markup = result instanceof Promise ? html`
                ${until(result.then(result => {
                if (result === nothing) {
                    this.toggleAttribute('hidden', true);
                }

                return result;
            }))}` : result;

            if (result === nothing) {
                this.toggleAttribute('hidden', true);
            }

            return html`${markup}`;
        }

        const url = this.content.data && 'Url' in this.content.data ? this.content.data['Url'].value ?? '' : null;

        const engagementSettings = settings.userEngagement?.content;

        return html`
            <div class="rw-content-tile${engagementSettings?.favorite ? ' --rw-has-favorite' : ''}">
                ${engagementSettings?.favorite
                    ? html`<relewise-content-favorite-button
                                .content=${this.content}
                                .user=${this.user}>
                            </relewise-content-favorite-button>`
                    : nothing}
                ${url
                    ? html`<a class='rw-content-link' href=${url}>${this.renderTileContent(this.content)}</a>`
                    : html`<div class='rw-content-link'>${this.renderTileContent(this.content)}</div>`}
                    ${engagementSettings?.sentiment
                        ? html`<relewise-content-sentiment-buttons
                                .content=${this.content}
                                .user=${this.user}>
                            </relewise-content-sentiment-buttons>`
                        : nothing}
            </div>`;
    }

    renderTileContent(content: ContentResult) {
        const image = content.data && 'ImageUrl' in content.data ? content.data['ImageUrl'].value : null;
        const summary = content.data && 'Summary' in content.data ? content.data['Summary'].value : null;

        return html`
            <div class="rw-image-container">
                ${image
                    ? html`<img class="rw-object-cover" src=${image} alt=${this.getContentImageAlt(content)} />`
                : nothing}
            </div>
            <div class='rw-information-container'>
                <h5 class='rw-display-name'>${content.displayName}</h5>
                ${summary ? html`<p class="rw-summary">${summary}</p>` : nothing}
            </div>`;
    }

    private getContentImageAlt(content: ContentResult): string {
        const altText = content.displayName ?? '';

        return altText ?? '';
    }

    static defaultStyles = [
        theme,
        css`
        :host {
            font-family: var(--font);
            border: 1px solid var(--relewise-checklist-facet-border-color, #eee);
            background-color: var(--button-color, white);
            clip-path: inset(0 round 0.5em);
            border-radius: 0.5em;
            box-shadow: 0 1px rgb(0 0 0 / 0.05);
        }

        .rw-content-tile {
            display: flex;
            flex-direction: column;
            position: relative;
            text-decoration: inherit;
            text-size-adjust: none;
            height: 100%;
            gap: var(--relewise-engagement-gap, 0.5em);
        }

        .rw-content-link {
            display: flex;
            flex-direction: column;
            text-decoration: inherit;
            color: inherit;
            flex: 1;
            justify-content: flex-end;
        }

        .rw-content-link:focus-visible {
            outline: 2px solid var(--relewise-focus-outline-color, #000);
            outline-offset: 2px;
        }

        .rw-image-container {
            display: flex;
            padding: var(--relewise-image-padding, 0);
            background-color: var(--relewise-image-background-color, #fff);
            justify-content: var(--relewise-image-align, center);
        }

        .rw-information-container {
            margin: var(--relewise-information-container-margin, 0.5em 0.5em);
        }

        .--rw-has-favorite .rw-display-name {
            margin-right: var(--relewise-favorite-space, 2.1em);
        }

        .rw-object-cover {
            object-fit: contain;
            max-width: var(--relewise-image-width, 100%);
            height: var(--relewise-image-height, auto);
        }

        .rw-display-name {
            display: -webkit-box;
            letter-spacing: var(--relewise-display-name-letter-spacing, -0.025em);
            justify-content: var(--relewise-display-name-alignment, start);
            color: var(--relewise-display-name-color, #212427);
            line-height: var(--relewise-display-name-line-height, 1);
            font-weight: var(--relewise-display-name-font-weight, 500);
            font-size: var(--relewise-display-name-font-size, 1em);
            margin: var(--relewise-display-name-margin, 0em 0em 0em 0em);
            overflow: hidden;
            height: calc(var(--relewise-display-name-line-height, 1.05em) * 2);
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
        }

        .rw-summary {
            margin: 0;
            font-size: calc(var(--relewise-base-font-size, 16px) * 0.9);
            line-height: var(--relewise-summary-line-height, 1.2);
            color: var(--relewise-summary-color, #666);
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            overflow: hidden;
            height: calc(var(--relewise-summary-line-height, 1.25em) * 2);
        }

    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-content-tile': ContentTile;
    }
}
