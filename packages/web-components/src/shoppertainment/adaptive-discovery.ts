import {
    FeedCompositionResult,
    FeedRecommendationInitializationBuilder,
    ProductResult,
    ContentResult,
    User,
} from '@relewise/client';
import { css, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { getSelectedContentProperties, getSelectedProductProperties } from '../defaultSettings';
import { Events } from '../helpers/events';
import {
    getRelewiseAdaptiveDiscoveryTargetedConfigurations,
    getRelewiseContextSettings,
    getRelewiseUIAdaptiveDiscoveryOptions,
    getRelewiseUIOptions,
} from '../helpers/relewiseUIOptions';
import { RelewiseLitElement } from '../relewise-lit-element';
import { getRecommender } from '../recommendations/recommender';

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
        window.removeEventListener(Events.contextSettingsUpdated, this.fetchFeedBound);
        super.disconnectedCallback();
    }

    private async fetchFeed(): Promise<void> {
        const generation = ++this.requestGeneration;
        this.abortController.abort();
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

            this.compositions = response?.recommendations ?? [];
        } catch (error) {
            if (!abortController.signal.aborted) {
                this.compositions = [];
                console.error('Relewise Web Components: Adaptive Discovery request failed.', error);
            }
        }
    }

    private renderProduct(product: ProductResult) {
        return html`
            <relewise-product-tile
                part="product-tile"
                .product=${product}
                .user=${this.user}>
            </relewise-product-tile>
        `;
    }

    private renderContent(content: ContentResult) {
        return html`
            <relewise-content-tile
                part="content-tile"
                .content=${content}
                .user=${this.user}>
            </relewise-content-tile>
        `;
    }

    render() {
        return html`${this.compositions.map(composition => [
            composition.products?.map(product => this.renderProduct(product)),
            composition.content?.map(content => this.renderContent(content)),
        ])}`;
    }

    static styles = css`
        :host {
            display: grid;
            width: 100%;
            grid-template-columns: repeat(var(--relewise-recommendation-grid-columns, 4), minmax(0, 1fr));
            gap: var(--relewise-recommendation-grid-gap, 1em);
            grid-auto-rows: 1fr;
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
