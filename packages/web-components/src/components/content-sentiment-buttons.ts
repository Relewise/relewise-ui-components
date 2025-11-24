import { ContentResult, User, UserFactory, userIsAnonymous } from '@relewise/client';
import { LitElement, PropertyValues, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { getTracker } from '../tracking';

export class ContentSentimentButtons extends LitElement {

    @property({ attribute: false })
    content: ContentResult | null = null;

    @property({ attribute: false })
    user: User | null = null;

    @state()
    private sentiment: 'Like' | 'Dislike' | null = null;

    protected willUpdate(changed: PropertyValues<this>): void {
        if (changed.has('content')) {
            const sentiment = this.content?.userEngagement?.sentiment;
            const normalized: 'Like' | 'Dislike' | null = sentiment === 'Like' || sentiment === 'Dislike' ? sentiment : null;
            if (this.sentiment !== normalized) {
                this.sentiment = normalized;
            }
        }
    }

    render() {
        console.log('render');
        if (!this.shouldRender()) {
            return nothing;
        }

        const likeLabel = this.sentiment === 'Like' ? 'Remove like' : 'Like';
        const dislikeLabel = this.sentiment === 'Dislike' ? 'Remove dislike' : 'Dislike';

        return html`
            <div class='rw-engagement-actions' role='group' aria-label='Content sentiment actions'>
                <button
                    class='rw-engagement-button'
                    type='button'
                    aria-label=${likeLabel}
                    title=${likeLabel}
                    aria-pressed=${this.sentiment === 'Like' ? 'true' : 'false'}
                    @click=${this.onLikeClick}>
                    ${this.sentiment === 'Like' ? html`<relewise-like-filled-icon></relewise-like-filled-icon>` : html`<relewise-like-icon></relewise-like-icon>`}
                </button>
                <button
                    class='rw-engagement-button'
                    type='button'
                    aria-label=${dislikeLabel}
                    title=${dislikeLabel}
                    aria-pressed=${this.sentiment === 'Dislike' ? 'true' : 'false'}
                    @click=${this.onDislikeClick}>
                    ${this.sentiment === 'Dislike' ? html`<relewise-dislike-filled-icon></relewise-dislike-filled-icon>` : html`<relewise-dislike-icon></relewise-dislike-icon>`}
                </button>
            </div>`;
    }

    private shouldRender(): boolean {
        const options = this.getOptions();
        if (!options?.userEngagement?.content?.sentiment) {
            this.toggleAttribute('hidden', true);
            return false;
        }

        if (!this.content?.contentId) {
            this.toggleAttribute('hidden', true);
            return false;
        }

        if (!this.user || userIsAnonymous(this.user)) {
            this.toggleAttribute('hidden', true);
            return false;
        }

        this.toggleAttribute('hidden', false);
        return true;
    }

    private getOptions() {
        try {
            return getRelewiseUIOptions();
        } catch (error) {
            console.warn('Relewise: Sentiment button is unable to find initializeRelewiseUI options.', error);
            return null;
        }
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

    private async submitEngagement(update: { sentiment?: 'Like' | 'Dislike' | null; }) {
        if (!this.content?.contentId) {
            console.warn('Relewise: Unable to track engagement for content without an id.');
            return;
        }

        const options = this.getOptions();
        if (!options) {
            return;
        }

        const sentiment = update.sentiment !== undefined ? update.sentiment : this.sentiment;

        this.sentiment = sentiment ?? null;
        try {
            const tracker = getTracker(options);
            await tracker.trackContentEngagement({
                user: this.user ?? UserFactory.anonymous(),
                contentId: this.content.contentId,
                engagement: {
                    sentiment: this.sentiment ? this.sentiment : 'Neutral',
                },
            });
        } catch (error) {
            console.error('Relewise: Failed to track content engagement.', error);
        }
    }

    static styles = css`
        :host {
            display: block;
            z-index: var(--relewise-sentiment-zindex, 10);
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
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-content-sentiment-buttons': ContentSentimentButtons;
    }
}
