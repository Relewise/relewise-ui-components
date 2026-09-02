import { assert, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import {
    ContentResult,
    FeedRecommendationInitializationRequest,
    FeedRecommendationResponse,
    ProductResult,
    Recommender,
} from '@relewise/client';
import {
    AdaptiveDiscovery,
    initializeRelewiseUI,
} from '../src';
import { Events } from '../src/helpers/events';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('relewise-adaptive-discovery', () => {
    const originalRecommendFeedInitialization = Recommender.prototype.recommendFeedInitialization;
    let requests: FeedRecommendationInitializationRequest[];

    setup(() => {
        requests = [];
        Recommender.prototype.recommendFeedInitialization = async request => {
            requests.push(request);
            return undefined;
        };
    });

    teardown(() => {
        Recommender.prototype.recommendFeedInitialization = originalRecommendFeedInitialization;
        fixtureCleanup();
        window.relewiseUIOptions = undefined!;
        window.relewiseUIShoppertainmentOptions = undefined;
    });

    test('is registered by useShoppertainment', async() => {
        initializeRelewiseUI(mockRelewiseOptions()).useShoppertainment({
            adaptiveDiscovery: {
                minimumPageSize: 4,
                configure: () => undefined,
            },
        });

        const element = await fixture(html`
            <relewise-adaptive-discovery></relewise-adaptive-discovery>
        `);

        assert.instanceOf(element, AdaptiveDiscovery);
    });

    test('renders product and content compositions with the built-in tiles', async() => {
        const product = { productId: 'product-1', displayName: 'Product' } as ProductResult;
        const content = { contentId: 'content-1', displayName: 'Content' } as ContentResult;
        let productFilterApplied = false;
        let contentFilterApplied = false;
        Recommender.prototype.recommendFeedInitialization = async request => {
            requests.push(request);
            return {
                initializedFeedId: 'feed-id',
                recommendations: [
                    { products: [product] },
                    { content: [content] },
                ],
            } as FeedRecommendationResponse;
        };

        const options = mockRelewiseOptions();
        options.filters = {
            product: () => productFilterApplied = true,
            content: () => contentFilterApplied = true,
        };
        initializeRelewiseUI(options).useShoppertainment({
            adaptiveDiscovery: {
                minimumPageSize: 12,
                configurationKey: 'home-page',
                configure: builder => builder.seed({ contentIds: ['seed-content'] }),
            },
        });

        const element = await fixture<AdaptiveDiscovery>(html`
            <relewise-adaptive-discovery displayed-at-location="Home page"></relewise-adaptive-discovery>
        `);

        await waitUntil(() => element.renderRoot.querySelector('relewise-content-tile') !== null);

        assert.equal(requests.length, 1);
        assert.equal(requests[0].feed.minimumPageSize, 12);
        assert.equal(requests[0].feed.configurationKey, 'home-page');
        assert.deepEqual(requests[0].feed.seed?.contentIds, ['seed-content']);
        assert.equal(requests[0].displayedAtLocationType, 'Home page');
        assert.isTrue(productFilterApplied);
        assert.isTrue(contentFilterApplied);
        assert.strictEqual(
            element.renderRoot.querySelector<HTMLElement & { product: ProductResult }>('relewise-product-tile')?.product,
            product,
        );
        assert.strictEqual(
            element.renderRoot.querySelector<HTMLElement & { content: ContentResult }>('relewise-content-tile')?.content,
            content,
        );
        assert.equal(element.renderRoot.querySelector('relewise-product-tile')?.getAttribute('part'), 'product-tile');
        assert.equal(element.renderRoot.querySelector('relewise-content-tile')?.getAttribute('part'), 'content-tile');
    });

    test('uses a target without requiring a default configuration', async() => {
        initializeRelewiseUI(mockRelewiseOptions())
            .useShoppertainment()
            .registerAdaptiveDiscoveryTarget('shopify-block', {
                minimumPageSize: 24,
                configure: builder => builder.seed({ productAndVariantIds: [{ productId: 'seed-product' }] }),
            });

        await fixture<AdaptiveDiscovery>(html`
            <relewise-adaptive-discovery target="shopify-block"></relewise-adaptive-discovery>
        `);

        await waitUntil(() => requests.length === 1);

        assert.equal(requests[0].feed.minimumPageSize, 24);
        assert.deepEqual(requests[0].feed.seed?.productAndVariantIds, [{ productId: 'seed-product' }]);
    });

    test('renders in Light DOM when configured', async() => {
        const options = mockRelewiseOptions();
        options.components = { domMode: 'light' };
        Recommender.prototype.recommendFeedInitialization = async() => ({
            initializedFeedId: 'feed-id',
            recommendations: [{ products: [{ productId: 'product-1' } as ProductResult] }],
        } as FeedRecommendationResponse);
        initializeRelewiseUI(options).useShoppertainment({
            adaptiveDiscovery: {
                minimumPageSize: 4,
                configure: () => undefined,
            },
        });

        const element = await fixture<AdaptiveDiscovery>(html`
            <relewise-adaptive-discovery></relewise-adaptive-discovery>
        `);

        await waitUntil(() => element.querySelector('relewise-product-tile') !== null);

        assert.strictEqual(element.renderRoot, element);
    });

    test('ignores an older response after the context changes', async() => {
        let resolveInitial!: (response: FeedRecommendationResponse) => void;
        const initialResponse = new Promise<FeedRecommendationResponse>(resolve => resolveInitial = resolve);
        const currentProduct = { productId: 'current' } as ProductResult;
        const staleProduct = { productId: 'stale' } as ProductResult;
        Recommender.prototype.recommendFeedInitialization = async request => {
            requests.push(request);
            return requests.length === 1
                ? initialResponse
                : {
                    initializedFeedId: 'current-feed',
                    recommendations: [{ products: [currentProduct] }],
                } as FeedRecommendationResponse;
        };
        initializeRelewiseUI(mockRelewiseOptions()).useShoppertainment({
            adaptiveDiscovery: {
                minimumPageSize: 4,
                configure: () => undefined,
            },
        });
        const element = await fixture<AdaptiveDiscovery>(html`
            <relewise-adaptive-discovery></relewise-adaptive-discovery>
        `);
        await waitUntil(() => requests.length === 1);

        window.dispatchEvent(new CustomEvent(Events.contextSettingsUpdated));
        await waitUntil(() => element.renderRoot.querySelector<HTMLElement & { product: ProductResult }>('relewise-product-tile')?.product === currentProduct);
        resolveInitial({
            initializedFeedId: 'stale-feed',
            recommendations: [{ products: [staleProduct] }],
        } as FeedRecommendationResponse);
        await initialResponse;
        await new Promise(resolve => setTimeout(resolve, 0));

        assert.strictEqual(
            element.renderRoot.querySelector<HTMLElement & { product: ProductResult }>('relewise-product-tile')?.product,
            currentProduct,
        );
    });
});
