import { ContentResult, User, userIsAnonymous } from '@relewise/client';
import { LitElement, PropertyValues, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { getTracker } from '../tracking';
import { FavoriteChangeDetail } from '../types/userEngagement';
import { favoriteButtonStyles } from '../helpers/favoriteButtonStyles';

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
        if (!this.shouldRender()) {
            return nothing;
        }

        const label = this.isFavorite ? 'Remove favorite' : 'Add to favorites';

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

    private shouldRender(): boolean {
        const options = this.getOptions();
        if (!options) {
            this.toggleAttribute('hidden', true);
            return false;
        }

        if (!options.userEngagement?.content?.favorite) {
            this.toggleAttribute('hidden', true);
            return false;
        }

        if (!this.content?.contentId) {
            console.warn('Relewise: Unable to render favorite button without content.');
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
            console.warn('Relewise: Favorite button is unable to find initializeRelewiseUI options.', error);
            return null;
        }
    }

    private async onToggle(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (this.isWorking) {
            return;
        }

        const nextState = !this.isFavorite;
        const options = this.getOptions();
        const contentId = this.content?.contentId ?? null;
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
        this.dispatchEvent(new CustomEvent<FavoriteChangeDetail>('favorite-change', {
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
