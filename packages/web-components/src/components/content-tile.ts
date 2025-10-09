import { ContentResult } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { theme } from '../theme';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { until } from 'lit-html/directives/until.js';

export class ContentTile extends LitElement {

    @property({ type: Object })
    content: ContentResult | null = null;

    connectedCallback(): void {
        super.connectedCallback();
    }

    render() {
        if (!this.content) {
            return;
        }

        const settings = getRelewiseUIOptions();
        if (settings.templates?.content) {
            const result = settings.templates.content(this.content, { html, helpers: { unsafeHTML, nothing } });
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

        if (this.content.data && 'Url' in this.content.data) {
            return html`
                <a class='rw-content-tile' href=${this.content.data['Url'].value ?? ''}>
                        ${this.renderTileContent(this.content)}
                </a>`;
        }

        return html`
            <div class='rw-content-tile'>
                ${this.renderTileContent(this.content)}
            </div>`;
    }

    renderTileContent(content: ContentResult) {
        const image = content.data && 'ImageUrl' in content.data ? content.data['ImageUrl'].value : null;
        const summary = content.data && 'Summary' in content.data ? content.data['Summary'].value : null;

        return html`
            ${image 
                ? html`<div class="rw-image-container"><img class="rw-object-cover" src=${image} alt=${this.getContentImageAlt(content)} /></div>` 
                : nothing}
            <div class='rw-information-container'>
                <h5 class='rw-display-name'>${content.displayName}</h5>
                ${summary ? html`<p class="rw-summary">${summary}</p>` : nothing}
            </div>`;
    }

    private getContentImageAlt(content: ContentResult): string {
        const altText = content.displayName ?? '';

        return altText ?? '';
    }

    static styles = [
        theme,
        css`
        :host {
            font-family: var(--font);
            border: 1px solid var(--relewise-checklist-facet-border-color, #eee);
            background-color: var(--button-color, white);
            border-radius: 0.5em;
            box-shadow: 0 1px rgb(0 0 0 / 0.05);
            overflow: hidden;
        }
        .rw-content-tile {
            display: flex;
            flex-direction: column;
            position: relative;
            text-decoration: inherit;
            text-size-adjust: none;
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
            height: calc(var(--relewise-display-name-line-height, 1.05em)* 2);
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
        }
        .rw-summary {
            margin: 0;
            font-size: calc(var(--relewise-base-font-size, 16px) * 0.9);;
            line-height: var(--relewise-summary-line-height, 1.2); ;
            color: var(--relewise-summary-color, #666);
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 3;
            overflow: hidden;
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-content-tile': ContentTile;
    }
}

