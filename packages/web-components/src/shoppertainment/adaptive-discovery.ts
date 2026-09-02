import {
    FeedCompositionResult,
    FeedItem,
    FeedRecommendationInitializationBuilder,
    FeedRecommendationNextItemsBuilder,
    ProductResult,
    ContentResult,
    User,
} from '@relewise/client';
import { css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { AdaptiveDiscoveryCompositionTemplate } from '../adaptiveDiscovery';
import { getSelectedContentProperties, getSelectedProductProperties } from '../defaultSettings';
import formatPrice from '../helpers/formatPrice';
import { Events } from '../helpers/events';
import {
    getRelewiseAdaptiveDiscoveryTargetedConfigurations,
    getRelewiseContextSettings,
    getRelewiseUIAdaptiveDiscoveryOptions,
    getRelewiseUIOptions,
} from '../helpers/relewiseUIOptions';
import { templateHelpers } from '../helpers/templateHelpers';
import { RelewiseLitElement } from '../relewise-lit-element';
import { getRecommender } from '../recommendations/recommender';
import { getTracker } from '../tracking';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';

export class AdaptiveDiscovery extends RelewiseLitElement {
    @property({ type: String })
    target: string | null = null;

    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string = undefined;

    @state()
    private compositions: FeedCompositionResult[] = [];

    @state()
    private user: User | null = null;

    private abortController = new AbortController();
    private compositionTemplates?: Record<string, AdaptiveDiscoveryCompositionTemplate>;
    private initializedFeedId: string | null = null;
    private intersectionObserver?: IntersectionObserver;
    private loadingMore = false;
    private hasMore = true;
    private maximumItems?: number;
    private requestGeneration = 0;
    private fetchFeedBound = this.fetchFeed.bind(this);

    connectedCallback(): void {
        super.connectedCallback();
        window.addEventListener(Events.contextSettingsUpdated, this.fetchFeedBound);
        void this.fetchFeed();
    }

    disconnectedCallback(): void {
        this.requestGeneration++;
        this.abortController.abort();
        this.intersectionObserver?.disconnect();
        window.removeEventListener(Events.contextSettingsUpdated, this.fetchFeedBound);
        super.disconnectedCallback();
    }

    protected firstUpdated(): void {
        this.intersectionObserver = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) {
                void this.loadMore();
            }
        }, {
            rootMargin: '0px 0px 400px 0px',
        });
    }

    private async fetchFeed(): Promise<void> {
        const generation = ++this.requestGeneration;
        this.abortController.abort();
        this.intersectionObserver?.disconnect();
        this.compositionTemplates = undefined;
        this.initializedFeedId = null;
        this.loadingMore = false;
        this.hasMore = true;
        this.maximumItems = undefined;
        const abortController = new AbortController();
        this.abortController = abortController;

        try {
            // Allow integrators a single tick to register a target before the first request runs.
            await new Promise(resolve => setTimeout(resolve, 0));

            const defaultConfiguration = getRelewiseUIAdaptiveDiscoveryOptions();
            const configuration = this.target
                ? getRelewiseAdaptiveDiscoveryTargetedConfigurations().resolve(this.target, defaultConfiguration)
                : defaultConfiguration;

            if (!configuration) {
                if (!this.target) {
                    console.error('Relewise Web Components: Adaptive Discovery is not configured.');
                }
                return;
            }

            this.compositionTemplates = configuration.compositionTemplates;

            const options = getRelewiseUIOptions();
            const settings = await getRelewiseContextSettings(
                this.displayedAtLocation ?? 'Relewise Adaptive Discovery',
            );

            if (generation !== this.requestGeneration || !this.isConnected) {
                return;
            }

            this.user = settings.user ?? null;
            const builder = new FeedRecommendationInitializationBuilder(settings, {
                minimumPageSize: configuration.minimumPageSize,
                configurationKey: configuration.configurationKey,
            })
                .setSelectedProductProperties(getSelectedProductProperties(options))
                .setSelectedVariantProperties(options.selectedPropertiesSettings?.variant ?? null)
                .setSelectedContentProperties(getSelectedContentProperties(options))
                .filters(builder => {
                    options.filters?.product?.(builder);
                    options.filters?.content?.(builder);
                })
                .relevanceModifiers(builder => {
                    options.relevanceModifiers?.product?.(builder);
                    options.relevanceModifiers?.content?.(builder);
                });

            configuration.configure(builder);

            const response = await getRecommender(options).recommendFeedInitialization(
                builder.build(),
                { abortSignal: abortController.signal },
            );

            if (generation !== this.requestGeneration || !this.isConnected) {
                return;
            }

            this.initializedFeedId = response?.initializedFeedId ?? null;
            this.maximumItems = configuration.maximumItems;
            const recommendations = response?.recommendations ?? [];
            this.compositions = this.takeItems(recommendations, this.maximumItems);
            this.hasMore = this.initializedFeedId !== null
                && this.hasItems(recommendations)
                && !this.hasReachedMaximumItems();

            await this.updateComplete;
            this.observeLoadMoreSentinel();
        } catch (error) {
            if (!abortController.signal.aborted) {
                this.compositions = [];
                console.error('Relewise Web Components: Adaptive Discovery request failed.', error);
            }
        }
    }

    private async loadMore(): Promise<void> {
        if (!this.initializedFeedId || this.loadingMore || !this.hasMore) {
            return;
        }

        const generation = this.requestGeneration;
        const initializedFeedId = this.initializedFeedId;
        const abortController = this.abortController;
        this.loadingMore = true;

        try {
            const response = await getRecommender(getRelewiseUIOptions()).recommendFeedNextItems(
                new FeedRecommendationNextItemsBuilder({ initializedFeedId }).build(),
                { abortSignal: abortController.signal },
            );

            if (generation !== this.requestGeneration || !this.isConnected) {
                return;
            }

            const nextCompositions = response?.recommendations ?? [];
            const hasNextItems = this.hasItems(nextCompositions);
            if (hasNextItems) {
                this.initializedFeedId = response?.initializedFeedId ?? initializedFeedId;
                this.compositions = [
                    ...this.compositions,
                    ...this.takeItems(nextCompositions, this.getRemainingItemCount()),
                ];
            }
            this.hasMore = hasNextItems && !this.hasReachedMaximumItems();
        } catch (error) {
            if (!abortController.signal.aborted) {
                console.error('Relewise Web Components: Loading more Adaptive Discovery items failed.', error);
            }
        } finally {
            if (generation === this.requestGeneration) {
                this.loadingMore = false;
            }
        }
    }

    private hasItems(compositions: FeedCompositionResult[]): boolean {
        return compositions.some(composition =>
            Boolean(composition.products?.length || composition.content?.length));
    }

    private getItemCount(compositions: FeedCompositionResult[]): number {
        return compositions.reduce(
            (count, composition) => count
                + (composition.products?.length ?? 0)
                + (composition.content?.length ?? 0),
            0,
        );
    }

    private getRemainingItemCount(): number | undefined {
        return this.maximumItems === undefined
            ? undefined
            : Math.max(0, this.maximumItems - this.getItemCount(this.compositions));
    }

    private hasReachedMaximumItems(): boolean {
        return this.maximumItems !== undefined
            && this.getItemCount(this.compositions) >= this.maximumItems;
    }

    private takeItems(
        compositions: FeedCompositionResult[],
        maximumItems: number | undefined,
    ): FeedCompositionResult[] {
        if (maximumItems === undefined) {
            return compositions;
        }

        let remainingItems = Math.max(0, maximumItems);
        const limitedCompositions: FeedCompositionResult[] = [];

        for (const composition of compositions) {
            if (remainingItems === 0) {
                break;
            }

            const products = composition.products?.slice(0, remainingItems);
            remainingItems -= products?.length ?? 0;
            const content = composition.content?.slice(0, remainingItems);
            remainingItems -= content?.length ?? 0;

            if (products?.length || content?.length) {
                limitedCompositions.push({ ...composition, products, content });
            }
        }

        return limitedCompositions;
    }

    private observeLoadMoreSentinel(): void {
        const sentinel = this.renderRoot.querySelector('.rw-load-more-sentinel');
        if (sentinel && this.hasMore) {
            this.intersectionObserver?.observe(sentinel);
        }
    }

    render() {
        return html`
            ${this.compositions.map(composition => this.renderComposition(composition))}
            <div class="rw-load-more-sentinel" aria-hidden="true"></div>
        `;
    }

    private renderComposition(composition: FeedCompositionResult) {
        const template = composition.name
            ? this.compositionTemplates?.[composition.name]
            : undefined;

        if (template) {
            return template(composition, {
                html,
                helpers: {
                    ...templateHelpers,
                    formatPrice,
                    unsafeHTML,
                    nothing,
                    user: this.user,
                    trackProductClick: product => this.trackProductClick(product),
                    trackContentClick: content => this.trackContentClick(content),
                },
            });
        }

        return [
            composition.products?.map(product => this.renderProduct(product)),
            composition.content?.map(content => this.renderContent(content)),
        ];
    }

    private renderProduct(product: ProductResult) {
        return html`
            <relewise-product-tile
                part="product-tile"
                .product=${product}
                .user=${this.user}
                @click=${() => this.trackProductClick(product)}>
            </relewise-product-tile>
        `;
    }

    private renderContent(content: ContentResult) {
        return html`
            <relewise-content-tile
                part="content-tile"
                .content=${content}
                .user=${this.user}
                @click=${() => this.trackContentClick(content)}>
            </relewise-content-tile>
        `;
    }

    private trackProductClick(product: ProductResult): void {
        if (!product.productId) {
            return;
        }

        this.trackItemClick({
            productAndVariantId: {
                productId: product.productId,
                variantId: product.variant?.variantId,
            },
        });
    }

    private trackContentClick(content: ContentResult): void {
        if (!content.contentId) {
            return;
        }

        this.trackItemClick({ contentId: content.contentId });
    }

    private trackItemClick(item: FeedItem): void {
        if (!this.initializedFeedId || !this.user) {
            return;
        }

        void getTracker(getRelewiseUIOptions()).trackFeedItemClick({
            user: this.user,
            feedId: this.initializedFeedId,
            item,
        }).catch(error => {
            console.error('Relewise Web Components: Tracking Adaptive Discovery item click failed.', error);
        });
    }

    static styles = css`
        :host {
            display: grid;
            position: relative;
            width: 100%;
            grid-template-columns: repeat(var(--relewise-recommendation-grid-columns, 4), minmax(0, 1fr));
            gap: var(--relewise-recommendation-grid-gap, 1em);
            grid-auto-rows: 1fr;
        }

        .rw-load-more-sentinel {
            position: absolute;
            right: 0;
            bottom: 0;
            left: 0;
            height: 1px;
            pointer-events: none;
        }

        @media (max-width: 768px) {
            :host {
                grid-template-columns: repeat(var(--relewise-recommendation-grid-mobile-columns, 2), minmax(0, 1fr));
            }
        }
    `;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-adaptive-discovery': AdaptiveDiscovery;
    }
}
