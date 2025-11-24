import { ProductResult, User, userIsAnonymous } from '@relewise/client';
import { LitElement, PropertyValues, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { getTracker } from '../tracking';
import { FavoriteChangeDetail } from '../types/userEngagement';

export class FavoriteButtonProducts extends LitElement {

    @property({ attribute: false })
    user: User | null = null;

    @property({ attribute: false })
    product: ProductResult | null = null;

    @state()
    private isWorking = false;

    @state()
    private isFavorite = false;

    protected willUpdate(changed: PropertyValues<this>): void {
        // Sync the local favourite state to match its userEngagement flag so the button stays accurate.
        if (changed.has('product')) {
            this.isFavorite = Boolean(this.product?.userEngagement?.isFavorite);
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

        if (!options.userEngagement?.product?.favorite) {
            this.toggleAttribute('hidden', true);
            return false;
        }

        if (!this.product?.productId) {
            console.warn('Relewise: Unable to render favorite button without a product.');
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
        const productId = this.product?.productId ?? null;
        const variantId = this.product?.variant?.variantId ?? null;
        const user = this.user;
        if (!options || !productId || !user || userIsAnonymous(user)) {
            return;
        }

        this.isFavorite = nextState;
        this.isWorking = true;

        try {
            const tracker = getTracker(options);
            await tracker.trackProductEngagement({
                user,
                product: {
                    productId,
                    variantId: variantId,
                },
                engagement: {
                    isFavorite: this.isFavorite,
                },
            });

            this.dispatchChangeEvent({
                isFavorite: this.isFavorite,
                entityType: 'product',
                productId,
                variantId,
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
        'relewise-product-favorite-button': FavoriteButtonProducts;
    }
}
