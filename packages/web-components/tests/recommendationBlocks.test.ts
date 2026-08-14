import { assert, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import { ProductResult, Recommender, SearchTermResult } from '@relewise/client';
import {
    initializeRelewiseUI,
    RecommendationBlocks,
    RecommendationBlocksEvents,
    RecommendationBlocksStateChangedEventDetail,
    RecommendationBlocksTermSelectedEventDetail,
    useRecommendations,
} from '../src';
import { clearRegisteredLightDomStylesForTesting } from '../src/lightDomStyles';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

function product(productId: string): ProductResult {
    return { productId, rank: 1, displayName: productId } as ProductResult;
}

suite('recommendation blocks', () => {
    const originalPopularProducts = Recommender.prototype.recommendPopularProducts;
    const originalBatchProducts = Recommender.prototype.batchProductRecommendations;
    const originalPopularContentCategories = Recommender.prototype.recommendPopularContentCategories;
    const originalPopularSearchTerms = Recommender.prototype.recommendPopularSearchTerms;

    setup(() => {
        Recommender.prototype.recommendPopularProducts = async function() {
            return { recommendations: [product('popular')] } as any;
        };
        Recommender.prototype.batchProductRecommendations = async function(requestCollection) {
            return {
                responses: requestCollection.requests?.map((_, index) => ({ recommendations: [product(`product-${index}`)] })),
            } as any;
        };
        Recommender.prototype.recommendPopularContentCategories = async function() {
            return { recommendations: [] } as any;
        };
        Recommender.prototype.recommendPopularSearchTerms = async function() {
            return { recommendations: [{ term: 'Trail shoes', rank: 1 }] } as any;
        };
    });

    teardown(() => {
        fixtureCleanup();
        clearRegisteredLightDomStylesForTesting();
        window.relewiseUISearchOptions = undefined!;
        window.relewiseUIOptions = undefined!;
        Recommender.prototype.recommendPopularProducts = originalPopularProducts;
        Recommender.prototype.batchProductRecommendations = originalBatchProducts;
        Recommender.prototype.recommendPopularContentCategories = originalPopularContentCategories;
        Recommender.prototype.recommendPopularSearchTerms = originalPopularSearchTerms;
    });

    test('registers for standalone recommendation use', () => {
        initializeRelewiseUI(mockRelewiseOptions());
        useRecommendations();

        assert.equal(customElements.get('relewise-recommendation-blocks'), RecommendationBlocks);
    });

    test('renders configured blocks in order with customizable titles', async() => {
        initializeRelewiseUI(mockRelewiseOptions());
        useRecommendations();

        const element = await fixture<RecommendationBlocks>(html`
            <relewise-recommendation-blocks
                .blocks=${[
                    { type: 'PopularProducts' as const, title: 'First block' },
                    { type: 'SearchTermBasedProduct' as const, title: 'Second block' },
                ]}
                term="shoes">
            </relewise-recommendation-blocks>
        `);

        await waitUntil(() => element.renderRoot.querySelectorAll('[part~="recommendation-block"]').length === 2);

        assert.notEqual(element.renderRoot, element);
        assert.deepEqual(
            [...element.renderRoot.querySelectorAll('[part="recommendation-title"]')].map(title => title.textContent),
            ['First block', 'Second block'],
        );
        assert.lengthOf(element.renderRoot.querySelectorAll('relewise-product-tile'), 2);
    });

    test('emits a composed term-selected event', async() => {
        initializeRelewiseUI(mockRelewiseOptions());
        useRecommendations();

        const element = await fixture<RecommendationBlocks>(html`
            <relewise-recommendation-blocks
                .blocks=${[{ type: 'PopularSearchTerms' as const }]}
                .targetEntityTypes=${['Product'] as const}>
            </relewise-recommendation-blocks>
        `);
        await waitUntil(() => element.renderRoot.querySelector('[part="recommendation-term"]') !== null);

        let selectedTerm: string | null = null;
        element.addEventListener(RecommendationBlocksEvents.termSelected, (event: Event) => {
            selectedTerm = (event as CustomEvent<RecommendationBlocksTermSelectedEventDetail>).detail.term;
            assert.isTrue(event.bubbles);
            assert.isTrue(event.composed);
        });
        element.renderRoot.querySelector<HTMLButtonElement>('[part="recommendation-term"]')!.click();

        assert.equal(selectedTerm, 'Trail shoes');
    });

    test('reports no results when every search-term recommendation is invalid', async() => {
        Recommender.prototype.recommendPopularSearchTerms = async function() {
            return { recommendations: [{ term: null, rank: 1 }, { term: undefined, rank: 2 }] as SearchTermResult[] } as any;
        };
        initializeRelewiseUI(mockRelewiseOptions());
        useRecommendations();

        const states: RecommendationBlocksStateChangedEventDetail[] = [];
        const element = await fixture<RecommendationBlocks>(html`
            <relewise-recommendation-blocks
                .blocks=${[{ type: 'PopularSearchTerms' as const }]}
                .targetEntityTypes=${['Product'] as const}>
            </relewise-recommendation-blocks>
        `);
        element.addEventListener(RecommendationBlocksEvents.stateChanged, (event: Event) => {
            states.push((event as CustomEvent<RecommendationBlocksStateChangedEventDetail>).detail);
        });

        await waitUntil(() => states.some(state => !state.loading));

        assert.isFalse(states.at(-1)!.hasResults);
        assert.isNull(element.renderRoot.querySelector('[part~="recommendation-block"]'));
    });

    test('reuses a successful empty response after being reactivated', async() => {
        let calls = 0;
        Recommender.prototype.recommendPopularProducts = async function() {
            calls++;
            return { recommendations: [] } as any;
        };
        initializeRelewiseUI(mockRelewiseOptions());
        useRecommendations();

        const element = await fixture<RecommendationBlocks>(html`
            <relewise-recommendation-blocks .blocks=${[{ type: 'PopularProducts' as const }]}></relewise-recommendation-blocks>
        `);
        await waitUntil(() => calls === 1);
        await element.updateComplete;

        element.active = false;
        await element.updateComplete;
        element.active = true;
        await element.updateComplete;

        assert.equal(calls, 1);
    });

    test('does not reload when array properties are replaced with equivalent values', async() => {
        let calls = 0;
        Recommender.prototype.recommendPopularProducts = async function() {
            calls++;
            return { recommendations: [product('popular')] } as any;
        };
        initializeRelewiseUI(mockRelewiseOptions());
        useRecommendations();

        const element = await fixture<RecommendationBlocks>(html`
            <relewise-recommendation-blocks
                .blocks=${[{ type: 'PopularProducts' as const }]}
                .targetEntityTypes=${['Product'] as const}>
            </relewise-recommendation-blocks>
        `);
        await waitUntil(() => calls === 1 && element.renderRoot.querySelector('relewise-product-tile') !== null);

        element.blocks = [{ type: 'PopularProducts' }];
        element.targetEntityTypes = ['Product'];
        await element.updateComplete;

        assert.equal(calls, 1);
    });

    test('retries an incomplete load after being reactivated', async() => {
        let productCalls = 0;
        Recommender.prototype.recommendPopularProducts = async function() {
            productCalls++;
            return { recommendations: [product('popular')] } as any;
        };
        Recommender.prototype.recommendPopularContentCategories = async function() {
            throw new Error('Content categories unavailable');
        };
        initializeRelewiseUI(mockRelewiseOptions());
        useRecommendations();

        const element = await fixture<RecommendationBlocks>(html`
            <relewise-recommendation-blocks
                .blocks=${[
                    { type: 'PopularProducts' as const },
                    { type: 'PopularContentCategories' as const },
                ]}>
            </relewise-recommendation-blocks>
        `);
        await waitUntil(() => productCalls === 1 && element.renderRoot.querySelector('relewise-product-tile') !== null);

        element.active = false;
        await element.updateComplete;
        element.active = true;
        await waitUntil(() => productCalls === 2);

        assert.equal(productCalls, 2);
    });

    test('ignores a stale response after its inputs change', async() => {
        let releaseFirstRequest!: () => void;
        const firstRequest = new Promise<void>(resolve => {
            releaseFirstRequest = resolve;
        });
        let calls = 0;
        Recommender.prototype.recommendPopularProducts = async function() {
            calls++;
            if (calls === 1) {
                await firstRequest;
                return { recommendations: [product('stale')] } as any;
            }
            return { recommendations: [product('current')] } as any;
        };
        initializeRelewiseUI(mockRelewiseOptions());
        useRecommendations();

        const element = await fixture<RecommendationBlocks>(html`
            <relewise-recommendation-blocks
                .blocks=${[{ type: 'PopularProducts' as const, title: 'First' }]}>
            </relewise-recommendation-blocks>
        `);
        await waitUntil(() => calls === 1);

        element.blocks = [{ type: 'PopularProducts', title: 'Second' }];
        await waitUntil(() => calls === 2 && element.renderRoot.querySelector('relewise-product-tile') !== null);
        releaseFirstRequest();
        await new Promise(resolve => setTimeout(resolve, 0));

        assert.equal(
            element.renderRoot.querySelector<HTMLElement & { product: ProductResult }>('relewise-product-tile')?.product.productId,
            'current',
        );
    });

    test('aborts its request when disconnected', async() => {
        let signal: AbortSignal | undefined;
        Recommender.prototype.recommendPopularProducts = async function(_, options) {
            signal = options?.abortSignal;
            return new Promise(() => undefined);
        };
        initializeRelewiseUI(mockRelewiseOptions());
        useRecommendations();

        const element = await fixture<RecommendationBlocks>(html`
            <relewise-recommendation-blocks .blocks=${[{ type: 'PopularProducts' as const }]}></relewise-recommendation-blocks>
        `);
        await waitUntil(() => signal !== undefined);
        element.remove();

        assert.isTrue(signal!.aborted);
    });

    test('renders in Light DOM', async() => {
        const options = mockRelewiseOptions();
        options.components = { domMode: 'light' };
        initializeRelewiseUI(options);
        useRecommendations();

        const element = await fixture<RecommendationBlocks>(html`
            <relewise-recommendation-blocks .blocks=${[{ type: 'PopularProducts' as const }]}></relewise-recommendation-blocks>
        `);
        await waitUntil(() => element.querySelector('relewise-product-tile') !== null);

        assert.equal(element.renderRoot, element);
        assert.exists(element.querySelector('[part~="recommendation-block"]'));
    });
});
