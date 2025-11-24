import { ProductResult, User, UserFactory, userIsAnonymous } from '@relewise/client';
import { LitElement, PropertyValues, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { getRelewiseUIOptions, getRelewiseUIRecommendationOptions } from '../helpers/relewiseUIOptions';
import { getTracker } from '../tracking';
import { SentimentChangeDetail } from '../types/userEngagement';
import { sentimentButtonStyles } from '../helpers/sentimentButtonStyles';

export class ProductSentimentButtons extends LitElement {

    @property({ attribute: false })
    product: ProductResult | null = null;

    @property({ attribute: false })
    user: User | null = null;

    @state()
    private sentiment: 'Like' | 'Dislike' | null = null;

    protected willUpdate(changed: PropertyValues<this>): void {
        if (changed.has('product')) {
            const sentiment = this.product?.userEngagement?.sentiment;
            const normalized: 'Like' | 'Dislike' | null = sentiment === 'Like' || sentiment === 'Dislike' ? sentiment : null;
            if (this.sentiment !== normalized) {
                this.sentiment = normalized;
            }
        }
    }

    render() {
        if (!this.shouldRender()) {
            return nothing;
        }

        const sentimentLocalization = getRelewiseUIRecommendationOptions()?.localization?.sentimentButtons;
        const likeLabel = this.sentiment === 'Like'
            ? sentimentLocalization?.removeLike ?? 'Remove like'
            : sentimentLocalization?.like ?? 'Like';
        const dislikeLabel = this.sentiment === 'Dislike'
            ? sentimentLocalization?.removeDislike ?? 'Remove dislike'
            : sentimentLocalization?.dislike ?? 'Dislike';

        return html`
            <div class='rw-engagement-actions' role='group' aria-label='Product sentiment actions'>
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
        if (!options?.userEngagement?.product?.sentiment) {
            this.toggleAttribute('hidden', true);
            return false;
        }

        if (!this.product?.productId) {
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
        if (!this.product?.productId) {
            console.warn('Relewise: Unable to track engagement for a product without an id.');
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
            await tracker.trackProductEngagement({
                user: this.user ?? UserFactory.anonymous(),
                product: {
                    productId: this.product.productId,
                    variantId: this.product.variant?.variantId,
                },
                engagement: {
                    sentiment: this.sentiment ? this.sentiment : 'Neutral',
                },
            });

            this.dispatchChangeEvent({
                sentiment: this.sentiment,
                entityType: 'Product',
                productId: this.product.productId,
                variantId: this.product.variant?.variantId,
            });
        } catch (error) {
            console.error('Relewise: Failed to track product engagement.', error);
        }
    }

    private dispatchChangeEvent(detail: SentimentChangeDetail) {
        this.dispatchEvent(new CustomEvent<SentimentChangeDetail>('sentiment-change', {
            bubbles: true,
            composed: true,
            detail,
        }));
    }

    static styles = sentimentButtonStyles;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-sentiment-buttons': ProductSentimentButtons;
    }
}
