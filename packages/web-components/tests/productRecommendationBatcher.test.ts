import { assert, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import { ProductResult, Recommender } from '@relewise/client';
import { initializeRelewiseUI, RecommendationBatcher } from '../src';
import { Events } from '../src/helpers/events';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

function product(productId: string): ProductResult {
    return { productId, rank: 1, displayName: productId } as ProductResult;
}

function queryAllDeep<T extends Element>(root: Element | DocumentFragment, selector: string): T[] {
    const matches = [...root.querySelectorAll<T>(selector)];
    root.querySelectorAll('*').forEach(element => {
        if (element.shadowRoot) {
            matches.push(...queryAllDeep<T>(element.shadowRoot, selector));
        }
    });
    return matches;
}

suite('product recommendation batcher', () => {
    const originalBatchProducts = Recommender.prototype.batchProductRecommendations;

    teardown(() => {
        Recommender.prototype.batchProductRecommendations = originalBatchProducts;
        fixtureCleanup();
        window.relewiseUIRecommendationOptions = undefined!;
        window.relewiseUIOptions = undefined!;
    });

    test('refreshes registered requests and ignores an older batch response after context changes', async() => {
        let batchCalls = 0;
        let resolveInitial!: (value: unknown) => void;
        const initialResponse = new Promise(resolve => resolveInitial = resolve);
        Recommender.prototype.batchProductRecommendations = async requestCollection => {
            batchCalls++;
            if (batchCalls === 1) {
                return initialResponse as never;
            }

            return {
                responses: requestCollection.requests?.map(() => ({
                    recommendations: [product('current')],
                })),
            } as never;
        };
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();

        const element = await fixture<RecommendationBatcher>(html`
            <relewise-product-recommendation-batcher>
                <relewise-popular-products displayed-at-location="test"></relewise-popular-products>
                <relewise-search-term-based-products displayed-at-location="test" term="Boots"></relewise-search-term-based-products>
            </relewise-product-recommendation-batcher>
        `);
        await waitUntil(() => batchCalls === 1);

        window.dispatchEvent(new CustomEvent(Events.contextSettingsUpdated));
        await waitUntil(() => batchCalls === 2);
        await waitUntil(() => queryAllDeep(element, 'relewise-product-tile').length === 2);

        resolveInitial({
            responses: [
                { recommendations: [product('stale')] },
                { recommendations: [product('stale')] },
            ],
        });
        await initialResponse;
        await new Promise(resolve => setTimeout(resolve, 0));

        assert.deepEqual(
            queryAllDeep<HTMLElement & { product: ProductResult }>(element, 'relewise-product-tile')
                .map(tile => tile.product.productId),
            ['current', 'current'],
        );
        assert.lengthOf(element.data.requests, 2);
        assert.isTrue(element.data.requests.every(request => request.id.isConnected && element.contains(request.id)));
    });
});
