import { assert, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import {
    ContentResult,
    ContentRecommendationResponse,
    ProductResult,
    ProductRecommendationResponse,
    Recommender,
} from '@relewise/client';
import { initializeRelewiseUI, PopularContent, PopularProducts } from '../src';
import { Events } from '../src/helpers/events';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('recommendation lifecycle', () => {
    const originalRecommendPopularProducts = Recommender.prototype.recommendPopularProducts;
    const originalRecommendPopularContent = Recommender.prototype.recommendPopularContents;

    teardown(() => {
        Recommender.prototype.recommendPopularProducts = originalRecommendPopularProducts;
        Recommender.prototype.recommendPopularContents = originalRecommendPopularContent;
        fixtureCleanup();
        window.relewiseUIOptions = undefined!;
    });

    test('product recommendation base removes its listener when disconnected during the initial request', async() => {
        let requests = 0;
        let resolveInitial!: (response: ProductRecommendationResponse) => void;
        const initialResponse = new Promise<ProductRecommendationResponse>(resolve => resolveInitial = resolve);
        Recommender.prototype.recommendPopularProducts = async() => {
            requests++;
            return initialResponse;
        };
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const element = await fixture<PopularProducts>(html`
            <relewise-popular-products displayed-at-location="test"></relewise-popular-products>
        `);
        await waitUntil(() => requests === 1);

        element.remove();
        resolveInitial({ recommendations: [] } as unknown as ProductRecommendationResponse);
        await initialResponse;
        window.dispatchEvent(new CustomEvent(Events.contextSettingsUpdated));
        await new Promise(resolve => setTimeout(resolve, 0));

        assert.equal(requests, 1);
        assert.isNull(element.renderRoot.querySelector('relewise-product-tile'));
    });

    test('content recommendation base removes its listener when disconnected during the initial request', async() => {
        let requests = 0;
        let resolveInitial!: (response: ContentRecommendationResponse) => void;
        const initialResponse = new Promise<ContentRecommendationResponse>(resolve => resolveInitial = resolve);
        Recommender.prototype.recommendPopularContents = async() => {
            requests++;
            return initialResponse;
        };
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const element = await fixture<PopularContent>(html`
            <relewise-popular-content displayed-at-location="test"></relewise-popular-content>
        `);
        await waitUntil(() => requests === 1);

        element.remove();
        resolveInitial({ recommendations: [] } as unknown as ContentRecommendationResponse);
        await initialResponse;
        window.dispatchEvent(new CustomEvent(Events.contextSettingsUpdated));
        await new Promise(resolve => setTimeout(resolve, 0));

        assert.equal(requests, 1);
        assert.isNull(element.renderRoot.querySelector('relewise-content-tile'));
    });

    test('product recommendation base ignores an older response after a context update', async() => {
        let requests = 0;
        let resolveInitial!: (response: ProductRecommendationResponse) => void;
        const initialResponse = new Promise<ProductRecommendationResponse>(resolve => resolveInitial = resolve);
        const currentProduct = { productId: 'current' } as ProductResult;
        const staleProduct = { productId: 'stale' } as ProductResult;
        Recommender.prototype.recommendPopularProducts = async() => {
            requests++;
            return requests === 1
                ? initialResponse
                : { recommendations: [currentProduct] } as ProductRecommendationResponse;
        };
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const element = await fixture<PopularProducts>(html`
            <relewise-popular-products displayed-at-location="test"></relewise-popular-products>
        `);
        await waitUntil(() => requests === 1);

        window.dispatchEvent(new CustomEvent(Events.contextSettingsUpdated));
        await waitUntil(() => element.renderRoot.querySelector<HTMLElement & { product: ProductResult }>('relewise-product-tile')?.product === currentProduct);
        resolveInitial({ recommendations: [staleProduct] } as ProductRecommendationResponse);
        await initialResponse;
        await new Promise(resolve => setTimeout(resolve, 0));

        assert.strictEqual(
            element.renderRoot.querySelector<HTMLElement & { product: ProductResult }>('relewise-product-tile')?.product,
            currentProduct,
        );
    });

    test('content recommendation base ignores an older response after a context update', async() => {
        let requests = 0;
        let resolveInitial!: (response: ContentRecommendationResponse) => void;
        const initialResponse = new Promise<ContentRecommendationResponse>(resolve => resolveInitial = resolve);
        const currentContent = { contentId: 'current' } as ContentResult;
        const staleContent = { contentId: 'stale' } as ContentResult;
        Recommender.prototype.recommendPopularContents = async() => {
            requests++;
            return requests === 1
                ? initialResponse
                : { recommendations: [currentContent] } as ContentRecommendationResponse;
        };
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const element = await fixture<PopularContent>(html`
            <relewise-popular-content displayed-at-location="test"></relewise-popular-content>
        `);
        await waitUntil(() => requests === 1);

        window.dispatchEvent(new CustomEvent(Events.contextSettingsUpdated));
        await waitUntil(() => element.renderRoot.querySelector<HTMLElement & { content: ContentResult }>('relewise-content-tile')?.content === currentContent);
        resolveInitial({ recommendations: [staleContent] } as ContentRecommendationResponse);
        await initialResponse;
        await new Promise(resolve => setTimeout(resolve, 0));

        assert.strictEqual(
            element.renderRoot.querySelector<HTMLElement & { content: ContentResult }>('relewise-content-tile')?.content,
            currentContent,
        );
    });

});
