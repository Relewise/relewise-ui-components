import { userIsAnonymous } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { getTracker } from '../tracking';
import { FavoriteChangeDetail } from './favorite-button-products';

export class FavoriteButtonContent extends LitElement {

    @property({ type: String, attribute: 'content-id' })
    contentId: string | null = null;

    @property({
        attribute: 'favorite',
        reflect: true,
        converter: {
            fromAttribute: (value: string | null) => {
                if (value === null) {
                    return false;
                }

                if (value === '' || value === undefined) {
                    return true;
                }

                return value !== 'false';
            },
            toAttribute: (value: boolean) => value ? '' : null,
        },
    })
    favorite = false;

    @state()
    private isWorking = false;

    render() {
        if (!this.shouldRender()) {
            return nothing;
        }

        const label = this.favorite ? 'Remove favorite' : 'Add to favorites';

        return html`
            <button
                class='rw-favorite-button'
                type='button'
                aria-pressed=${this.favorite ? 'true' : 'false'}
                aria-label=${label}
                title=${label}
                @click=${this.onToggle}
                ?disabled=${this.isWorking}>
                ${this.favorite ? html`<relewise-heart-filled-icon aria-hidden='true'></relewise-heart-filled-icon>` : html`<relewise-heart-icon aria-hidden='true'></relewise-heart-icon>`}
            </button>`;
    }

    private shouldRender(): boolean {
        const options = this.getOptions();
        if (!options) {
            this.toggleAttribute('hidden', true);
            return false;
        }

        if (!this.contentId) {
            console.warn('Relewise: Unable to render favorite button without a content id.');
            this.toggleAttribute('hidden', true);
            return false;
        }

        if (userIsAnonymous(options.contextSettings.getUser())) {
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

        const next = !this.favorite;
        const options = this.getOptions();
        if (!options || !this.contentId) {
            return;
        }

        this.favorite = next;
        this.isWorking = true;

        try {
            const tracker = getTracker(options);
            await tracker.trackContentEngagement({
                user: options.contextSettings.getUser(),
                contentId: this.contentId,
                engagement: {
                    isFavorite: this.favorite,
                },
            });

            this.dispatchChangeEvent();
        } catch (error) {
            console.error('Relewise: Failed to track favorite action.', error);
            this.favorite = !next;
        } finally {
            this.isWorking = false;
        }
    }

    private dispatchChangeEvent() {
        this.dispatchEvent(new CustomEvent<FavoriteChangeDetail>('relewise-favorite-change', {
            bubbles: true,
            composed: true,
            detail: {
                isFavorite: this.favorite,
            },
        }));
    }

    static styles = css`
        :host {
            position: absolute;
            top: var(--relewise-favorite-top, 0.5em);
            right: var(--relewise-favorite-right, 0.5em);
            display: flex;
            z-index: var(--relewise-favorite-zindex, 10);
        }

        .rw-favorite-button {
            border: 0;
            background-color: var(--relewise-favorite-background, rgba(255, 255, 255, 0.9));
            padding: var(--relewise-favorite-padding, 0.35em);
            color: inherit;
            cursor: pointer;
            border-radius: var(--relewise-favorite-border-radius, 9999px);
            box-shadow: var(--relewise-favorite-shadow, 0 1px 4px rgba(0, 0, 0, 0.12));
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s ease;
        }

        .rw-favorite-button:focus-visible {
            outline: 2px solid var(--relewise-focus-outline-color, #000);
            outline-offset: 2px;
        }
    `;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-content-favorite-button': FavoriteButtonContent;
    }
}
