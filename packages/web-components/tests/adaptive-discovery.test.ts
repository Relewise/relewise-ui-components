import { assert, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import {
    ContentResult,
    FeedRecommendationInitializationRequest,
    FeedRecommendationNextItemsRequest,
    FeedRecommendationResponse,
    ProductResult,
    Recommender,
    Tracker,
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
    const originalTrackFeedItemClick = Tracker.prototype.trackFeedItemClick;
    const originalTrackFeedDwell = Tracker.prototype.trackFeedDwell;
    const originalIntersectionObserver = window.IntersectionObserver;
    const originalPerformanceNow = Object.getOwnPropertyDescriptor(performance, 'now');
    let requests: FeedRecommendationInitializationRequest[];
    let nextRequests: FeedRecommendationNextItemsRequest[];
    let trackedClicks: Parameters<Tracker['trackFeedItemClick']>[0][];
    let trackedDwells: Parameters<Tracker['trackFeedDwell']>[0][];
    let now: number;

    class MockIntersectionObserver {
        static instances: MockIntersectionObserver[] = [];

        readonly observedElements = new Set<Element>();

        constructor(
            private callback: IntersectionObserverCallback,
            readonly options?: IntersectionObserverInit,
        ) {
            MockIntersectionObserver.instances.push(this);
        }

        observe(element: Element): void {
            this.observedElements.add(element);
        }

        unobserve(element: Element): void {
            this.observedElements.delete(element);
        }

        disconnect(): void {
            this.observedElements.clear();
        }

        trigger(isIntersecting: boolean, intersectionRatio = isIntersecting ? 1 : 0): void {
            if (this.observedElements.size === 0) {
                return;
            }

            const entries = [...this.observedElements].map(target => ({
                isIntersecting,
                intersectionRatio,
                target,
            } as IntersectionObserverEntry));
            this.callback(entries, this as unknown as IntersectionObserver);
        }

        triggerElement(
            target: Element,
            isIntersecting: boolean,
            intersectionRatio = isIntersecting ? 1 : 0,
        ): void {
            if (!this.observedElements.has(target)) {
                return;
            }

            this.callback([{
                isIntersecting,
                intersectionRatio,
                target,
            } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
        }
    }

    setup(() => {
        requests = [];
        nextRequests = [];
        trackedClicks = [];
        trackedDwells = [];
        now = 0;
        Object.defineProperty(performance, 'now', {
            configurable: true,
            value: () => now,
        });
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
        Tracker.prototype.trackFeedItemClick = async click => {
            trackedClicks.push(click);
        };
        Tracker.prototype.trackFeedDwell = async dwell => {
            trackedDwells.push(dwell);
        };
    });

    teardown(() => {
        Recommender.prototype.recommendFeedInitialization = originalRecommendFeedInitialization;
        Recommender.prototype.recommendFeedNextItems = originalRecommendFeedNextItems;
        Tracker.prototype.trackFeedItemClick = originalTrackFeedItemClick;
        Tracker.prototype.trackFeedDwell = originalTrackFeedDwell;
        window.IntersectionObserver = originalIntersectionObserver;
        fixtureCleanup();
        if (originalPerformanceNow) {
            Object.defineProperty(performance, 'now', originalPerformanceNow);
        } else {
            Reflect.deleteProperty(performance, 'now');
        }
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

    test('uses a named composition template instead of the built-in tiles', async() => {
        const product = { productId: 'featured-product', displayName: 'Featured product' } as ProductResult;
        Recommender.prototype.recommendFeedInitialization = async() => ({
            initializedFeedId: 'feed-id',
            recommendations: [{ name: 'featured', products: [product] }],
        } as FeedRecommendationResponse);
        initializeRelewiseUI(mockRelewiseOptions()).useShoppertainment({
            adaptiveDiscovery: {
                minimumPageSize: 4,
                configure: () => undefined,
                compositionTemplates: {
                    featured: (composition, { html, helpers }) => html`
                        <button
                            ${helpers.trackProductVisibility(composition.products![0])}
                            class="featured-composition"
                            @click=${() => helpers.trackProductClick(composition.products![0])}>
                            ${composition.products![0].displayName}
                        </button>
                    `,
                },
            },
        });
        const element = await fixture<AdaptiveDiscovery>(html`
            <relewise-adaptive-discovery></relewise-adaptive-discovery>
        `);
        await waitUntil(() => element.renderRoot.querySelector('.featured-composition') !== null);

        assert.isNull(element.renderRoot.querySelector('relewise-product-tile'));
        assert.equal(element.renderRoot.querySelector('.featured-composition')?.textContent?.trim(), 'Featured product');
        assert.isTrue(
            MockIntersectionObserver.instances
                .find(observer => observer.options?.threshold === 0.9)
                ?.observedElements.has(element.renderRoot.querySelector('.featured-composition')!) ?? false,
        );

        element.renderRoot.querySelector<HTMLElement>('.featured-composition')?.click();

        assert.equal(trackedClicks.length, 1);
        assert.deepEqual(trackedClicks[0].item, {
            productAndVariantId: { productId: 'featured-product', variantId: undefined },
        });
    });

    test('tracks product and content tile clicks against the initialized feed', async() => {
        Recommender.prototype.recommendFeedInitialization = async() => ({
            initializedFeedId: 'feed-id',
            recommendations: [
                {
                    products: [{
                        productId: 'product-1',
                        variant: { variantId: 'variant-1' },
                    } as ProductResult],
                },
                { content: [{ contentId: 'content-1' } as ContentResult] },
            ],
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
        await waitUntil(() => element.renderRoot.querySelector('relewise-content-tile') !== null);

        element.renderRoot.querySelector<HTMLElement>('relewise-product-tile')?.click();
        element.renderRoot.querySelector<HTMLElement>('relewise-content-tile')?.click();

        assert.equal(trackedClicks.length, 2);
        assert.equal(trackedClicks[0].feedId, 'feed-id');
        assert.deepEqual(trackedClicks[0].item, {
            productAndVariantId: {
                productId: 'product-1',
                variantId: 'variant-1',
            },
        });
        assert.equal(trackedClicks[1].feedId, 'feed-id');
        assert.deepEqual(trackedClicks[1].item, { contentId: 'content-1' });
    });

    test('tracks dwell for items that remain at least 90% visible between scrolls', async() => {
        Recommender.prototype.recommendFeedInitialization = async() => ({
            initializedFeedId: 'feed-id',
            recommendations: [
                {
                    products: [{
                        productId: 'product-1',
                        variant: { variantId: 'variant-1' },
                    } as ProductResult],
                },
                { content: [{ contentId: 'content-1' } as ContentResult] },
            ],
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
        await waitUntil(() => element.renderRoot.querySelector('relewise-content-tile') !== null);

        const productTile = element.renderRoot.querySelector('relewise-product-tile')!;
        const contentTile = element.renderRoot.querySelector('relewise-content-tile')!;
        const dwellObserver = MockIntersectionObserver.instances
            .find(observer => observer.options?.threshold === 0.9)!;
        dwellObserver.triggerElement(productTile, true, 1);
        dwellObserver.triggerElement(contentTile, true, 0.89);

        now = 5_000;
        window.dispatchEvent(new Event('scroll'));
        assert.equal(trackedDwells.length, 0);

        now = 7_001;
        window.dispatchEvent(new Event('scroll'));

        assert.equal(trackedDwells.length, 1);
        assert.equal(trackedDwells[0].feedId, 'feed-id');
        assert.equal(trackedDwells[0].dwellTimeMilliseconds, 2_001);
        assert.deepEqual(trackedDwells[0].visibleItems, [{
            productAndVariantId: {
                productId: 'product-1',
                variantId: 'variant-1',
            },
        }]);
    });

    test('resets the dwell window when the visible items change', async() => {
        Recommender.prototype.recommendFeedInitialization = async() => ({
            initializedFeedId: 'feed-id',
            recommendations: [
                { products: [{ productId: 'product-1' } as ProductResult] },
                { content: [{ contentId: 'content-1' } as ContentResult] },
            ],
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
        await waitUntil(() => element.renderRoot.querySelector('relewise-content-tile') !== null);

        const dwellObserver = MockIntersectionObserver.instances
            .find(observer => observer.options?.threshold === 0.9)!;
        dwellObserver.triggerElement(
            element.renderRoot.querySelector('relewise-product-tile')!,
            true,
        );
        window.dispatchEvent(new Event('scroll'));

        now = 1_500;
        dwellObserver.triggerElement(
            element.renderRoot.querySelector('relewise-content-tile')!,
            true,
        );
        now = 3_000;
        window.dispatchEvent(new Event('scroll'));
        assert.equal(trackedDwells.length, 0);

        now = 5_001;
        window.dispatchEvent(new Event('scroll'));

        assert.equal(trackedDwells.length, 1);
        assert.equal(trackedDwells[0].dwellTimeMilliseconds, 2_001);
        assert.deepEqual(trackedDwells[0].visibleItems, [
            { productAndVariantId: { productId: 'product-1', variantId: undefined } },
            { contentId: 'content-1' },
        ]);
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

    test('renders a named composition template in Light DOM', async() => {
        const options = mockRelewiseOptions();
        options.components = { domMode: 'light' };
        Recommender.prototype.recommendFeedInitialization = async() => ({
            initializedFeedId: 'feed-id',
            recommendations: [{ name: 'banner', content: [{ contentId: 'content-1' } as ContentResult] }],
        } as FeedRecommendationResponse);
        initializeRelewiseUI(options).useShoppertainment({
            adaptiveDiscovery: {
                minimumPageSize: 4,
                configure: () => undefined,
                compositionTemplates: {
                    banner: (composition, { html }) => html`
                        <article class="custom-banner">${composition.content![0].contentId}</article>
                    `,
                },
            },
        });

        const element = await fixture<AdaptiveDiscovery>(html`
            <relewise-adaptive-discovery></relewise-adaptive-discovery>
        `);
        await waitUntil(() => element.querySelector('.custom-banner') !== null);

        assert.strictEqual(element.renderRoot, element);
        assert.equal(element.querySelector('.custom-banner')?.textContent, 'content-1');
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
        const dwellObserver = MockIntersectionObserver.instances
            .find(instance => instance.options?.threshold === 0.9)!;
        dwellObserver.triggerElement(
            element.renderRoot.querySelector('relewise-product-tile')!,
            true,
        );
        window.dispatchEvent(new Event('scroll'));
        now = 3_000;
        element.remove();
        observer.trigger(true);
        await new Promise(resolve => setTimeout(resolve, 0));

        assert.equal(observer.observedElements.size, 0);
        assert.equal(dwellObserver.observedElements.size, 0);
        assert.equal(trackedDwells.length, 0);
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
