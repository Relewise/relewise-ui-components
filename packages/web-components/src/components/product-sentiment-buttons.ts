import { ProductResult, User, UserFactory } from '@relewise/client';
import { LitElement, PropertyValues, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { getTracker } from '../tracking';
import { SentimentChangeDetail } from '../types/userEngagement';
import { sentimentButtonStyles } from '../helpers/sentimentButtonStyles';
import { canRenderUserEngagementAction } from 'src/helpers/userEngagementRenderGuard';

export class ProductSentimentButtons extends LitElement {

    @property({ attribute: false })
    user: User | null = null;

    @property({ attribute: false })
    product: ProductResult | null = null;

    @state()
    private sentiment: 'Like' | 'Dislike' | null = null;

    @state()
    private isWorking = false;

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
        const options = getRelewiseUIOptions();
        const canRender = canRenderUserEngagementAction({
            enabled: Boolean(options?.userEngagement?.product?.sentiment),
            entityId: this.product?.productId,
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
            <div class='rw-sentiment-actions' role='group' aria-label='Product sentiment actions'>
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
        if (!this.product?.productId) {
            console.warn('Relewise: Unable to track engagement for a product without an id.');
            return;
        }

        const options = getRelewiseUIOptions();

        const sentiment = update.sentiment !== undefined ? update.sentiment : this.sentiment;

        const previousSentiment = this.sentiment;
        this.sentiment = sentiment ?? null;
        this.isWorking = true;
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
    }

    static styles = sentimentButtonStyles;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-sentiment-buttons': ProductSentimentButtons;
    }
}
