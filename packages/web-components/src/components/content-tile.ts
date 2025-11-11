import { ContentResult } from '@relewise/client';
import { LitElement, PropertyValues, adoptStyles, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { templateHelpers } from '../helpers/templateHelpers';
import { UserEngagementOptions } from '../initialize';
import { theme } from '../theme';
import { getTracker } from '../tracking';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { until } from 'lit-html/directives/until.js';

export class ContentTile extends LitElement {

    @property({ type: Object })
    content: ContentResult | null = null;

    @state()
    private sentiment: 'Like' | 'Dislike' | null = null;

    @state()
    private isFavorite = false;

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

    connectedCallback(): void {
        super.connectedCallback();
    }

    protected willUpdate(changed: PropertyValues<this>): void {
        super.willUpdate(changed);

        if (changed.has('content')) {
            const sentiment = this.content?.userEngagement?.sentiment;
            const normalizedSentiment: 'Like' | 'Dislike' | null = sentiment === 'Like' || sentiment === 'Dislike' ? sentiment : null;
            const favorite = Boolean(this.content?.userEngagement?.isFavorite);

            if (this.sentiment !== normalizedSentiment) {
                this.sentiment = normalizedSentiment;
            }

            if (this.isFavorite !== favorite) {
                this.isFavorite = favorite;
            }
        }
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

        return html`
            <div class='rw-content-tile'>
                ${this.renderEngagementActions(settings.userEngagement)}
                ${url
                ? html`<a class='rw-content-link' href=${url}>${this.renderTileContent(this.content)}</a>`
                : html`<div class='rw-content-link'>${this.renderTileContent(this.content)}</div>`}
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

    private renderEngagementActions(settings: UserEngagementOptions | undefined) {
        const showSentiment = Boolean(settings?.sentiment);
        const showFavorite = Boolean(settings?.favorite);

        if (!showSentiment && !showFavorite) {
            return nothing;
        }

        return html`
            <div class='rw-engagement-actions' role='group' aria-label='Content engagement actions'>
                ${showSentiment ? html`
                    <button
                        class='rw-engagement-button'
                        type='button'
                        aria-pressed=${this.sentiment === 'Like' ? 'true' : 'false'}
                        @click=${this.onLikeClick}>
                        Like
                    </button>
                    <button
                        class='rw-engagement-button'
                        type='button'
                        aria-pressed=${this.sentiment === 'Dislike' ? 'true' : 'false'}
                        @click=${this.onDislikeClick}>
                        Dislike
                    </button>` : nothing}
                ${showFavorite ? html`
                    <button
                        class='rw-engagement-button'
                        type='button'
                        aria-pressed=${this.isFavorite ? 'true' : 'false'}
                        @click=${this.onFavoriteClick}>
                        Favorite
                    </button>` : nothing}
            </div>`;
    }

    private async onLikeClick(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        const newSentiment: 'Like' | 'Dislike' | null = this.sentiment === 'Like' ? null : 'Like';
        await this.submitEngagement({ sentiment: newSentiment });
    }

    private async onDislikeClick(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        const newSentiment: 'Like' | 'Dislike' | null = this.sentiment === 'Dislike' ? null : 'Dislike';
        await this.submitEngagement({ sentiment: newSentiment });
    }

    private async onFavoriteClick(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        await this.submitEngagement({ isFavorite: !this.isFavorite });
    }

    private async submitEngagement(update: { sentiment?: 'Like' | 'Dislike' | null; isFavorite?: boolean; }) {
        if (!this.content?.contentId) {
            console.warn('Relewise: Unable to track engagement for content without an id.');
            return;
        }

        const options = getRelewiseUIOptions();
        const sentiment = update.sentiment !== undefined ? update.sentiment : this.sentiment;
        const isFavorite = update.isFavorite !== undefined ? update.isFavorite : this.isFavorite;

        this.sentiment = sentiment ?? null;
        this.isFavorite = Boolean(isFavorite);

        try {
            const tracker = getTracker(options);
            await tracker.trackContentEngagement({
                user: options.contextSettings.getUser(),
                contentId: this.content.contentId!,
                engagement: {
                    sentiment: this.sentiment ? this.sentiment : 'Neutral',
                    isFavorite: this.isFavorite,
                },
            });
        } catch (error) {
            console.error('Relewise: Failed to track content engagement.', error);
        }
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

        .rw-engagement-actions {
            display: flex;
            gap: var(--relewise-engagement-button-gap, 0.5em);
            padding: var(--relewise-engagement-padding, 0.5em 0.75em 0 0.75em);
        }

        .rw-engagement-button {
            border: 1px solid var(--relewise-engagement-border-color, #d1d5db);
            border-radius: var(--relewise-engagement-border-radius, 9999px);
            background-color: var(--relewise-engagement-background, transparent);
            color: inherit;
            cursor: pointer;
            font: inherit;
            padding: var(--relewise-engagement-button-padding, 0.35em 0.9em);
            transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
        }

        .rw-engagement-button[aria-pressed="true"],
        .rw-engagement-button:hover {
            background-color: var(--relewise-engagement-active-background, #212427);
            color: var(--relewise-engagement-active-color, #fff);
            border-color: var(--relewise-engagement-active-border-color, #212427);
        }

        .rw-engagement-button:focus-visible {
            outline: 2px solid var(--relewise-focus-outline-color, #000);
            outline-offset: 2px;
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-content-tile': ContentTile;
    }
}
