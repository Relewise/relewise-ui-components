import { ContentResult, User, userIsAnonymous } from '@relewise/client';
import { LitElement, PropertyValues, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { getTracker } from '../tracking';
import { FavoriteChangeDetail } from '../types/userEngagement';
import { favoriteButtonStyles } from '../helpers/favoriteButtonStyles';
import { canRenderFavoriteButton } from '../helpers/favoriteRenderGuard';

export class FavoriteButtonContent extends LitElement {

    @property({ attribute: false })
    user: User | null = null;

    @property({ attribute: false })
    content: ContentResult | null = null;

    @state()
    private isWorking = false;

    @state()
    private isFavorite = false;

    protected willUpdate(changed: PropertyValues<this>): void {
        // Sync the local favourite state to match its userEngagement flag so the button stays accurate.
        if (changed.has('content')) {
            this.isFavorite = Boolean(this.content?.userEngagement?.isFavorite);
        }
    }

    render() {
        const options = getRelewiseUIOptions();
        const canRender = canRenderFavoriteButton({
            favoriteEnabled: Boolean(options?.userEngagement?.content?.favorite),
            entityId: this.content?.contentId,
            user: this.user,
        });

        this.toggleAttribute('hidden', !canRender);

        if (!canRender) {
            return nothing;
        }

        const localization = getRelewiseUIOptions().localization?.favoriteButton;
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
    }

    static styles = favoriteButtonStyles;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-content-favorite-button': FavoriteButtonContent;
    }
}
