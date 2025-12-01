import { ContentResult, User, UserFactory } from '@relewise/client';
import { LitElement, PropertyValues, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { getTracker } from '../tracking';
import { SentimentChangeDetail, FavoriteChangeDetail } from '../types/userEngagement';
import { Events } from '../helpers/events';
import { sentimentButtonStyles } from '../helpers/sentimentButtonStyles';
import { canRenderUserEngagementAction } from '../helpers/userEngagementRenderGuard';

export class ContentSentimentButtons extends LitElement {

    @property({ attribute: false })
    user: User | null = null;

    @property({ attribute: false })
    content: ContentResult | null = null;

    @state()
    private sentiment: 'Like' | 'Dislike' | null = null;

    @state()
    private isWorking = false;

    private handleUserEngagementChanged = (evt: Event) => {
        const detail = (evt as CustomEvent).detail as (SentimentChangeDetail | FavoriteChangeDetail | undefined);
        if (!detail) return;
        if (detail.entityType && detail.entityType !== 'Content') return;
        if ((detail as any).contentId !== this.content?.contentId) return;
        if ((detail as SentimentChangeDetail).sentiment === undefined) return;

        const incoming = (detail as SentimentChangeDetail).sentiment;
        this.sentiment = incoming === 'Like' || incoming === 'Dislike' ? incoming : null;
    };

    connectedCallback(): void {
        super.connectedCallback();
        try { window.addEventListener(Events.userEngagementChanged, this.handleUserEngagementChanged as EventListener); } catch (e) { /* non-browser */ }
    }

    disconnectedCallback(): void {
        try { window.removeEventListener(Events.userEngagementChanged, this.handleUserEngagementChanged as EventListener); } catch (e) { /* non-browser */ }
        super.disconnectedCallback();
    }

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
        const options = getRelewiseUIOptions();
        const canRender = canRenderUserEngagementAction({
            enabled: Boolean(options?.userEngagement?.content?.sentiment),
            entityId: this.content?.contentId,
            user: this.user,
        });

        this.toggleAttribute('hidden', !canRender);

        if (!canRender) {
            return nothing;
        }

        const sentimentLocalization = options.localization?.sentimentButtons;
        const likeLabel = this.sentiment === 'Like'
            ? sentimentLocalization?.removeLike ?? 'Remove like'
            : sentimentLocalization?.like ?? 'Like';
        const dislikeLabel = this.sentiment === 'Dislike'
            ? sentimentLocalization?.removeDislike ?? 'Remove dislike'
            : sentimentLocalization?.dislike ?? 'Dislike';

        return html`
            <div class='rw-sentiment-actions' role='group' aria-label='Content sentiment actions'>
                <button
                    class='rw-sentiment-button'
                    type='button'
                    aria-label=${likeLabel}
                    title=${likeLabel}
                    aria-pressed=${this.sentiment === 'Like' ? 'true' : 'false'}
                    ?disabled=${this.isWorking}
                    @click=${this.onLikeClick}>
                    ${this.sentiment === 'Like' ? html`<relewise-like-filled-icon></relewise-like-filled-icon>` : html`<relewise-like-icon></relewise-like-icon>`}
                </button>
                <button
                    class='rw-sentiment-button'
                    type='button'
                    aria-label=${dislikeLabel}
                    title=${dislikeLabel}
                    aria-pressed=${this.sentiment === 'Dislike' ? 'true' : 'false'}
                    ?disabled=${this.isWorking}
                    @click=${this.onDislikeClick}>
                    ${this.sentiment === 'Dislike' ? html`<relewise-dislike-filled-icon></relewise-dislike-filled-icon>` : html`<relewise-dislike-icon></relewise-dislike-icon>`}
                </button>
            </div>`;
    }

    private async onLikeClick(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (this.isWorking) {
            return;
        }

        const newSentiment: 'Like' | 'Dislike' | null = this.sentiment === 'Like' ? null : 'Like';
        await this.submitEngagement({ sentiment: newSentiment });
    }

    private async onDislikeClick(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (this.isWorking) {
            return;
        }

        const newSentiment: 'Like' | 'Dislike' | null = this.sentiment === 'Dislike' ? null : 'Dislike';
        await this.submitEngagement({ sentiment: newSentiment });
    }

    private async submitEngagement(update: { sentiment?: 'Like' | 'Dislike' | null; }) {
        if (!this.content?.contentId) {
            console.warn('Relewise: Unable to track engagement for content without an id.');
            return;
        }

        const options = getRelewiseUIOptions();
        if (!options) {
            return;
        }

        const sentiment = update.sentiment !== undefined ? update.sentiment : this.sentiment;

        const previousSentiment = this.sentiment;
        this.sentiment = sentiment ?? null;
        this.isWorking = true;
        try {
            const tracker = getTracker(options);
            await tracker.trackContentEngagement({
                user: this.user ?? UserFactory.anonymous(),
                contentId: this.content.contentId,
                engagement: {
                    sentiment: this.sentiment ? this.sentiment : 'Neutral',
                },
            });

            this.dispatchChangeEvent({
                sentiment: this.sentiment,
                entityType: 'Content',
                contentId: this.content.contentId,
            });
        } catch (error) {
            console.error('Relewise: Failed to track content engagement.', error);
            this.sentiment = previousSentiment ?? null;
        } finally {
            this.isWorking = false;
        }
    }

    private dispatchChangeEvent(detail: SentimentChangeDetail) {
        this.dispatchEvent(new CustomEvent<SentimentChangeDetail>('change', {
            bubbles: true,
            composed: true,
            detail,
        }));
        try { window.dispatchEvent(new CustomEvent(Events.userEngagementChanged, { detail })); } catch (e) { /* ignore in non-browser envs */ }
    }

    static styles = sentimentButtonStyles;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-content-sentiment-buttons': ContentSentimentButtons;
    }
}
