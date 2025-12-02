import { ContentResult, User, userIsAnonymous } from '@relewise/client';
import { LitElement, PropertyValues, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { getTracker } from '../tracking';
import { FavoriteChangeDetail, SentimentChangeDetail } from '../types/userEngagement';
import { Events } from '../helpers/events';
import { favoriteButtonStyles } from '../helpers/favoriteButtonStyles';
import { canRenderUserEngagementAction } from '../helpers/userEngagementRenderGuard';

export class FavoriteButtonContent extends LitElement {

    @property({ attribute: false })
    user: User | null = null;

    @property({ attribute: false })
    content: ContentResult | null = null;

    @state()
    private isWorking = false;

    @state()
    private isFavorite = false;

    private handleUserEngagementChanged = (evt: Event) => {
        const detail = (evt as CustomEvent).detail as (FavoriteChangeDetail | SentimentChangeDetail | undefined);
        if (!detail) return;
        if (detail.entityType && detail.entityType !== 'Content') return;
        if ((detail as any).contentId !== this.content?.contentId) return;
        if ((detail as FavoriteChangeDetail).isFavorite === undefined) return;

        this.isFavorite = Boolean((detail as FavoriteChangeDetail).isFavorite);
    };

    connectedCallback(): void {
        super.connectedCallback();

        try {
            window.addEventListener(Events.userEngagementChanged, this.handleUserEngagementChanged as EventListener);
        }
        catch (e) { /* non-browser */ }
    }

    disconnectedCallback(): void {
        try {
            window.removeEventListener(Events.userEngagementChanged, this.handleUserEngagementChanged as EventListener);
        }
        catch (e) { /* non-browser */ }

        super.disconnectedCallback();
    }

    protected willUpdate(changed: PropertyValues<this>): void {
        // Sync the local favourite state to match its userEngagement flag so the button stays accurate.
        if (changed.has('content')) {
            this.isFavorite = Boolean(this.content?.userEngagement?.isFavorite);
        }
    }

    render() {
        const options = getRelewiseUIOptions();
        const canRender = canRenderUserEngagementAction({
            enabled: Boolean(options?.userEngagement?.content?.favorite),
            entityId: this.content?.contentId,
            user: this.user,
        });

        this.toggleAttribute('hidden', !canRender);

        if (!canRender) {
            return nothing;
        }

        const localization = options.localization?.favoriteButton;
        const label = this.isFavorite
            ? localization?.removeFavorite ?? 'Remove favorite'
            : localization?.addToFavorites ?? 'Add to favorites';

        return html`
            <button
                class='rw-favorite-button'
                type='button'
                aria-pressed=${this.isFavorite ? 'true' : 'false'}
                aria-label=${label}
                title=${label}
                @click=${this.onToggle}
                ?disabled=${this.isWorking}>
                ${this.isFavorite
                ? html`<relewise-heart-filled-icon aria-hidden='true'></relewise-heart-filled-icon>`
                : html`<relewise-heart-icon aria-hidden='true'></relewise-heart-icon>`}
            </button>`;
    }

    private async onToggle(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (this.isWorking) {
            return;
        }

        const nextState = !this.isFavorite;
        const options = getRelewiseUIOptions();
        const contentId = this.content?.contentId;
        const user = this.user;
        if (!options || !contentId || !user || userIsAnonymous(user)) {
            return;
        }

        this.isFavorite = nextState;
        this.isWorking = true;

        try {
            const tracker = getTracker(options);
            await tracker.trackContentEngagement({
                user,
                contentId,
                engagement: {
                    isFavorite: this.isFavorite,
                },
            });

            this.dispatchChangeEvent({
                isFavorite: this.isFavorite,
                entityType: 'Content',
                contentId,
            });
        } catch (error) {
            console.error('Relewise: Failed to track favorite action.', error);
            this.isFavorite = !nextState;
        } finally {
            this.isWorking = false;
        }
    }

    private dispatchChangeEvent(detail: FavoriteChangeDetail) {
        this.dispatchEvent(new CustomEvent<FavoriteChangeDetail>('change', {
            bubbles: true,
            composed: true,
            detail,
        }));

        try {
            window.dispatchEvent(new CustomEvent(Events.userEngagementChanged, { detail }));
        }
        catch (e) { /* ignore in non-browser envs */ }
    }

    static styles = favoriteButtonStyles;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-content-favorite-button': FavoriteButtonContent;
    }
}
