import { assert, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import {
    PopularProductCategoriesRecommendationRequest,
    ProductCategoryResult,
    Recommender,
} from '@relewise/client';
import { initializeRelewiseUI, PopularProductCategories } from '../src';
import type { RecommendationStateChangedEventDetail } from '../src';
import { Events } from '../src/helpers/events';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('relewise-popular-product-categories', () => {
    const originalRecommend = Recommender.prototype.recommendPopularProductCategories;
    let requests: PopularProductCategoriesRecommendationRequest[];

    setup(() => {
        requests = [];
        Recommender.prototype.recommendPopularProductCategories = async request => {
            requests.push(request);
            return {
                recommendations: [
                    { categoryId: 'first', displayName: 'First', rank: 1, data: {} } as ProductCategoryResult,
                    { categoryId: 'second', displayName: 'Second', rank: 2, data: {} } as ProductCategoryResult,
                ],
            };
        };
    });

    teardown(() => {
        Recommender.prototype.recommendPopularProductCategories = originalRecommend;
        fixtureCleanup();
        window.relewiseUIOptions = undefined!;
    });

    test('registers, requests, and renders product categories', async() => {
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const states: RecommendationStateChangedEventDetail[] = [];
        const element = await fixture<PopularProductCategories>(html`
            <relewise-popular-product-categories
                displayed-at-location="test"
                number-of-recommendations="2"
                since-minutes-ago="60"
                @relewise-ui-components:recommendation-state-changed=${(event: CustomEvent<RecommendationStateChangedEventDetail>) => states.push(event.detail)}>
            </relewise-popular-product-categories>
        `);

        await waitUntil(() => requests.length === 1 && element.renderRoot.querySelectorAll('relewise-product-category-tile').length === 2);

        assert.instanceOf(element, PopularProductCategories);
        assert.equal(requests[0].settings.numberOfRecommendations, 2);
        assert.equal(requests[0].sinceMinutesAgo, 60);
        assert.equal(element.renderRoot.querySelectorAll('relewise-product-category-tile').length, 2);
        assert.isNull(element.renderRoot.querySelector('[part~="recommendation-grid"]'));
        assert.deepInclude(states, { loading: true, hasResults: false });
        assert.deepInclude(states, { loading: false, hasResults: true });
        assert.equal(Events.recommendationStateChanged, 'relewise-ui-components:recommendation-state-changed');
    });

    test('refreshes recommendations when context changes', async() => {
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const element = await fixture<PopularProductCategories>(html`
            <relewise-popular-product-categories displayed-at-location="test"></relewise-popular-product-categories>
        `);
        await waitUntil(() => requests.length === 1 && element.renderRoot.querySelectorAll('relewise-product-category-tile').length === 2);

        window.dispatchEvent(new CustomEvent(Events.contextSettingsUpdated));
        await waitUntil(() => requests.length === 2);

        assert.equal(element.renderRoot.querySelectorAll('relewise-product-category-tile').length, 2);
    });

    test('does not retain a context listener when disconnected during the initial request', async() => {
        let resolveInitial!: (response: { recommendations: ProductCategoryResult[] }) => void;
        const initialResponse = new Promise<{ recommendations: ProductCategoryResult[] }>(resolve => resolveInitial = resolve);
        Recommender.prototype.recommendPopularProductCategories = async request => {
            requests.push(request);
            return initialResponse;
        };
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const element = await fixture<PopularProductCategories>(html`
            <relewise-popular-product-categories displayed-at-location="test"></relewise-popular-product-categories>
        `);
        await waitUntil(() => requests.length === 1);

        element.remove();
        resolveInitial({ recommendations: [] });
        await initialResponse;
        window.dispatchEvent(new CustomEvent(Events.contextSettingsUpdated));
        await new Promise(resolve => setTimeout(resolve, 0));

        assert.lengthOf(requests, 1);
        assert.isNull(element.renderRoot.querySelector('relewise-product-category-tile'));
    });

    test('forwards category tile parts in Shadow DOM', async() => {
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const element = await fixture<PopularProductCategories>(html`
            <relewise-popular-product-categories displayed-at-location="test"></relewise-popular-product-categories>
        `);
        await waitUntil(() => element.renderRoot.querySelector('relewise-product-category-tile') !== null);

        assert.equal(
            element.renderRoot.querySelector('relewise-product-category-tile')?.getAttribute('exportparts'),
            'link, container, image-container, image, information, display-name',
        );
    });

    test('renders the heading slot and category grid only when categories are available', async() => {
        let resolveRecommendations!: (response: { recommendations: ProductCategoryResult[] }) => void;
        Recommender.prototype.recommendPopularProductCategories = () => new Promise(resolve => resolveRecommendations = resolve);
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const element = await fixture<PopularProductCategories>(html`
            <relewise-popular-product-categories displayed-at-location="test">
                <h2 slot="before-results">Popular categories</h2>
            </relewise-popular-product-categories>
        `);

        await waitUntil(() => resolveRecommendations !== undefined);
        assert.isNull(element.shadowRoot!.querySelector('slot[name="before-results"]'));

        resolveRecommendations({ recommendations: [{ categoryId: 'first', displayName: 'First' } as ProductCategoryResult] });
        await waitUntil(() => element.shadowRoot!.querySelector('[part~="recommendation-grid"]') !== null);

        const slot = element.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="before-results"]')!;
        const grid = element.shadowRoot!.querySelector<HTMLElement>('[part~="recommendation-grid"]')!;
        assert.equal(slot.assignedElements()[0]?.textContent, 'Popular categories');
        assert.isTrue(grid.part.contains('category-recommendation-grid'));
    });

    test('ignores an older response after a context update', async() => {
        let resolveInitial!: (response: { recommendations: ProductCategoryResult[] }) => void;
        const initialResponse = new Promise<{ recommendations: ProductCategoryResult[] }>(resolve => resolveInitial = resolve);
        const currentCategory = { categoryId: 'current', displayName: 'Current' } as ProductCategoryResult;
        const staleCategory = { categoryId: 'stale', displayName: 'Stale' } as ProductCategoryResult;
        Recommender.prototype.recommendPopularProductCategories = async request => {
            requests.push(request);
            return requests.length === 1
                ? initialResponse
                : { recommendations: [currentCategory] };
        };
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const element = await fixture<PopularProductCategories>(html`
            <relewise-popular-product-categories displayed-at-location="test"></relewise-popular-product-categories>
        `);
        await waitUntil(() => requests.length === 1);

        window.dispatchEvent(new CustomEvent(Events.contextSettingsUpdated));
        await waitUntil(() => element.renderRoot.querySelector<HTMLElement & { productCategory: ProductCategoryResult }>('relewise-product-category-tile')?.productCategory === currentCategory);
        resolveInitial({ recommendations: [staleCategory] });
        await initialResponse;
        await new Promise(resolve => setTimeout(resolve, 0));

        assert.strictEqual(
            element.renderRoot.querySelector<HTMLElement & { productCategory: ProductCategoryResult }>('relewise-product-category-tile')?.productCategory,
            currentCategory,
        );
    });

});
