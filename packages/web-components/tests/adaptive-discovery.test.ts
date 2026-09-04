import { assert, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import {
    ContentResult,
    FeedRecommendationInitializationRequest,
    FeedRecommendationNextItemsRequest,
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
    const originalRecommendFeedNextItems = Recommender.prototype.recommendFeedNextItems;
    const originalIntersectionObserver = window.IntersectionObserver;
    let requests: FeedRecommendationInitializationRequest[];
    let nextRequests: FeedRecommendationNextItemsRequest[];

    class MockIntersectionObserver {
        static instances: MockIntersectionObserver[] = [];

        readonly observedElements = new Set<Element>();
        readonly observeCalls: Element[] = [];
        readonly unobserveCalls: Element[] = [];

        constructor(
            private callback: IntersectionObserverCallback,
            readonly options?: IntersectionObserverInit,
        ) {
            MockIntersectionObserver.instances.push(this);
        }

        observe(element: Element): void {
            this.observeCalls.push(element);
            this.observedElements.add(element);
        }

        unobserve(element: Element): void {
            this.unobserveCalls.push(element);
            this.observedElements.delete(element);
        }

        disconnect(): void {
            this.observedElements.clear();
        }

        trigger(isIntersecting: boolean): void {
            if (this.observedElements.size === 0) {
                return;
            }

            const entries = [...this.observedElements].map(target => ({
                isIntersecting,
                target,
            } as IntersectionObserverEntry));
            this.callback(entries, this as unknown as IntersectionObserver);
        }
    }

    setup(() => {
        requests = [];
        nextRequests = [];
        MockIntersectionObserver.instances = [];
        window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
        Recommender.prototype.recommendFeedInitialization = async request => {
            requests.push(request);
            return undefined;
        };
        Recommender.prototype.recommendFeedNextItems = async request => {
            nextRequests.push(request);
            return undefined;
        };
    });

    teardown(() => {
        Recommender.prototype.recommendFeedInitialization = originalRecommendFeedInitialization;
        Recommender.prototype.recommendFeedNextItems = originalRecommendFeedNextItems;
        window.IntersectionObserver = originalIntersectionObserver;
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

    test('loads and appends the next items when the bottom sentinel is close to the viewport', async() => {
        const initialProduct = { productId: 'initial' } as ProductResult;
        const nextProduct = { productId: 'next' } as ProductResult;
        const nextContent = { contentId: 'next-content' } as ContentResult;
        let resolveNext!: (response: FeedRecommendationResponse) => void;
        const nextResponse = new Promise<FeedRecommendationResponse>(resolve => resolveNext = resolve);
        Recommender.prototype.recommendFeedInitialization = async request => {
            requests.push(request);
            return {
                initializedFeedId: 'feed-id',
                recommendations: [{ products: [initialProduct] }],
            } as FeedRecommendationResponse;
        };
        Recommender.prototype.recommendFeedNextItems = async request => {
            nextRequests.push(request);
            return nextResponse;
        };
        initializeRelewiseUI(mockRelewiseOptions()).useShoppertainment({
            adaptiveDiscovery: {
                minimumPageSize: 4,
                maximumItems: 3,
                configure: () => undefined,
            },
        });
        const element = await fixture<AdaptiveDiscovery>(html`
            <relewise-adaptive-discovery></relewise-adaptive-discovery>
        `);
        await waitUntil(() => element.renderRoot.querySelectorAll('relewise-product-tile').length === 1
            && MockIntersectionObserver.instances[0]?.observedElements.size === 1);

        const observer = MockIntersectionObserver.instances[0];
        assert.equal(observer.options?.rootMargin, '0px 0px 400px 0px');
        observer.trigger(true);
        observer.trigger(true);
        await waitUntil(() => nextRequests.length === 1);

        assert.equal(nextRequests[0].initializedFeedId, 'feed-id');
        resolveNext({
            initializedFeedId: 'feed-id',
            recommendations: [
                { products: [nextProduct] },
                { content: [nextContent] },
            ],
        } as FeedRecommendationResponse);
        await waitUntil(() => element.renderRoot.querySelectorAll('relewise-product-tile').length === 2
            && element.renderRoot.querySelectorAll('relewise-content-tile').length === 1);

        assert.deepEqual(
            [...element.renderRoot.querySelectorAll<HTMLElement & { product: ProductResult }>('relewise-product-tile')]
                .map(tile => tile.product.productId),
            ['initial', 'next'],
        );

        observer.trigger(false);
        observer.trigger(true);
        await new Promise(resolve => setTimeout(resolve, 0));

        assert.equal(nextRequests.length, 1);
    });

    test('does not render more than the configured maximum items from the initial response', async() => {
        Recommender.prototype.recommendFeedInitialization = async() => ({
            initializedFeedId: 'feed-id',
            recommendations: [
                {
                    products: [
                        { productId: 'product-1' } as ProductResult,
                        { productId: 'product-2' } as ProductResult,
                    ],
                },
                { content: [{ contentId: 'content-1' } as ContentResult] },
            ],
        } as FeedRecommendationResponse);
        initializeRelewiseUI(mockRelewiseOptions()).useShoppertainment({
            adaptiveDiscovery: {
                minimumPageSize: 4,
                maximumItems: 2,
                configure: () => undefined,
            },
        });

        const element = await fixture<AdaptiveDiscovery>(html`
            <relewise-adaptive-discovery></relewise-adaptive-discovery>
        `);
        await waitUntil(() => element.renderRoot.querySelectorAll('relewise-product-tile').length === 2);

        assert.isNull(element.renderRoot.querySelector('relewise-content-tile'));
        assert.equal(MockIntersectionObserver.instances[0].observedElements.size, 0);
    });

    test('re-arms loading when the sentinel remains close after appending items', async() => {
        Recommender.prototype.recommendFeedInitialization = async() => ({
            initializedFeedId: 'feed-id',
            recommendations: [{ products: [{ productId: 'initial' } as ProductResult] }],
        } as FeedRecommendationResponse);
        Recommender.prototype.recommendFeedNextItems = async request => {
            nextRequests.push(request);
            return {
                initializedFeedId: 'feed-id',
                recommendations: [{ products: [{ productId: 'next' } as ProductResult] }],
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
        await waitUntil(() => MockIntersectionObserver.instances[0]?.observedElements.size === 1);

        const observer = MockIntersectionObserver.instances[0];
        const sentinel = element.renderRoot.querySelector('.rw-load-more-sentinel')!;
        observer.trigger(true);

        await waitUntil(() => element.renderRoot.querySelectorAll('relewise-product-tile').length === 2
            && observer.observeCalls.length === 2);

        assert.strictEqual(observer.observeCalls[0], sentinel);
        assert.strictEqual(observer.observeCalls[1], sentinel);
        assert.include(observer.unobserveCalls, sentinel);
    });

    test('stops requesting next items after the feed returns an empty page', async() => {
        Recommender.prototype.recommendFeedInitialization = async request => {
            requests.push(request);
            return {
                initializedFeedId: 'feed-id',
                recommendations: [{ products: [{ productId: 'initial' } as ProductResult] }],
            } as FeedRecommendationResponse;
        };
        Recommender.prototype.recommendFeedNextItems = async request => {
            nextRequests.push(request);
            return {
                initializedFeedId: 'feed-id',
                recommendations: [],
            } as unknown as FeedRecommendationResponse;
        };
        initializeRelewiseUI(mockRelewiseOptions()).useShoppertainment({
            adaptiveDiscovery: {
                minimumPageSize: 4,
                configure: () => undefined,
            },
        });
        await fixture<AdaptiveDiscovery>(html`
            <relewise-adaptive-discovery></relewise-adaptive-discovery>
        `);
        await waitUntil(() => MockIntersectionObserver.instances[0]?.observedElements.size === 1);

        const observer = MockIntersectionObserver.instances[0];
        observer.trigger(true);
        await waitUntil(() => nextRequests.length === 1);
        await new Promise(resolve => setTimeout(resolve, 0));
        observer.trigger(false);
        observer.trigger(true);
        await new Promise(resolve => setTimeout(resolve, 0));

        assert.equal(nextRequests.length, 1);
    });

    test('disconnects the bottom observer when removed', async() => {
        Recommender.prototype.recommendFeedInitialization = async() => ({
            initializedFeedId: 'feed-id',
            recommendations: [{ products: [{ productId: 'initial' } as ProductResult] }],
        } as FeedRecommendationResponse);
        initializeRelewiseUI(mockRelewiseOptions()).useShoppertainment({
            adaptiveDiscovery: {
                minimumPageSize: 4,
                configure: () => undefined,
            },
        });
        const element = await fixture<AdaptiveDiscovery>(html`
            <relewise-adaptive-discovery></relewise-adaptive-discovery>
        `);
        await waitUntil(() => MockIntersectionObserver.instances[0]?.observedElements.size === 1);

        const observer = MockIntersectionObserver.instances[0];
        element.remove();
        observer.trigger(true);
        await new Promise(resolve => setTimeout(resolve, 0));

        assert.equal(observer.observedElements.size, 0);
        assert.equal(nextRequests.length, 0);
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
