import { ProductResult, User, userIsAnonymous } from '@relewise/client';
import { LitElement, PropertyValues, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { getTracker } from '../tracking';
import { FavoriteChangeDetail } from '../types/userEngagement';
import { favoriteButtonStyles } from '../helpers/favoriteButtonStyles';
import { canRenderFavoriteButton } from '../helpers/favoriteRenderGuard';

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
        const canRender = canRenderFavoriteButton({
            favoriteEnabled: Boolean(getRelewiseUIOptions()?.userEngagement?.product?.favorite),
            entityId: this.product?.productId,
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
        const productId = this.product?.productId;
        const variantId = this.product?.variant?.variantId;
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
                    productId: productId,
                    variantId: variantId,
                },
                engagement: {
                    isFavorite: this.isFavorite,
                },
            });

            this.dispatchChangeEvent({
                isFavorite: this.isFavorite,
                entityType: 'Product',
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
        'relewise-product-favorite-button': FavoriteButtonProducts;
    }
}
