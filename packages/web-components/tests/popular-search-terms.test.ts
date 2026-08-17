import { assert, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import { PopularSearchTermsRecommendationRequest, Recommender, SearchTermResult } from '@relewise/client';
import {
    initializeRelewiseUI,
    PopularSearchTerms,
    PopularSearchTermsEvents,
    PopularSearchTermsTermSelectedEventDetail,
} from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';
import { clearRegisteredLightDomStylesForTesting } from '../src/lightDomStyles';
import { Events } from '../src/helpers/events';

suite('relewise-popular-search-terms', () => {
    const originalRecommend = Recommender.prototype.recommendPopularSearchTerms;
    let requests: PopularSearchTermsRecommendationRequest[];

    setup(() => {
        requests = [];
        Recommender.prototype.recommendPopularSearchTerms = async request => {
            requests.push(request);
            return {
                recommendations: [
                    { term: 'Trail shoes', rank: 1 },
                    { term: null, rank: 2 },
                ] as SearchTermResult[],
            };
        };
    });

    teardown(() => {
        Recommender.prototype.recommendPopularSearchTerms = originalRecommend;
        fixtureCleanup();
        clearRegisteredLightDomStylesForTesting();
        window.relewiseUIOptions = undefined!;
    });

    test('requests and renders usable search terms', async() => {
        let targetedConfigurationApplied = false;
        const options = mockRelewiseOptions();
        options.targets = {
            recommendationTargets: configurations => configurations.add({
                target: 'search terms target',
                configuration: { filters: () => targetedConfigurationApplied = true },
            }),
        };
        initializeRelewiseUI(options).useRecommendations();
        const element = await fixture<PopularSearchTerms>(html`
            <relewise-popular-search-terms
                displayed-at-location="test"
                term="trail"
                target="search terms target"
                number-of-recommendations="5"
                .targetEntityTypes=${['Product', 'ProductCategory']}>
            </relewise-popular-search-terms>
        `);

        await waitUntil(() => requests.length === 1 && element.renderRoot.querySelectorAll('[part="term"]').length === 1);

        assert.equal(requests[0].term, 'trail');
        assert.equal(requests[0].settings?.numberOfRecommendations, 5);
        assert.deepEqual(requests[0].settings?.targetEntityTypes, ['Product', 'ProductCategory']);
        assert.isTrue(targetedConfigurationApplied);
    });

    test('emits the selected term', async() => {
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const element = await fixture<PopularSearchTerms>(html`
            <relewise-popular-search-terms displayed-at-location="test"></relewise-popular-search-terms>
        `);
        await waitUntil(() => element.renderRoot.querySelector<HTMLButtonElement>('[part="term"]') !== null);

        let selectedTerm: string | null = null;
        element.addEventListener(PopularSearchTermsEvents.termSelected, event => {
            selectedTerm = (event as CustomEvent<PopularSearchTermsTermSelectedEventDetail>).detail.term;
            assert.isTrue(event.bubbles);
            assert.isTrue(event.composed);
        });
        element.renderRoot.querySelector<HTMLButtonElement>('[part="term"]')!.click();

        assert.equal(selectedTerm, 'Trail shoes');
    });

    test('renders in Light DOM when configured', async() => {
        const options = mockRelewiseOptions();
        options.components = { domMode: 'light' };
        initializeRelewiseUI(options).useRecommendations();
        const element = await fixture<PopularSearchTerms>(html`
            <relewise-popular-search-terms displayed-at-location="test"></relewise-popular-search-terms>
        `);

        await waitUntil(() => element.querySelector('[part="term"]') !== null);

        assert.equal(element.renderRoot, element);
    });

    test('refreshes recommendations when context changes', async() => {
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        await fixture<PopularSearchTerms>(html`
            <relewise-popular-search-terms displayed-at-location="test"></relewise-popular-search-terms>
        `);
        await waitUntil(() => requests.length === 1);

        window.dispatchEvent(new CustomEvent(Events.contextSettingsUpdated));
        await waitUntil(() => requests.length === 2);

        assert.lengthOf(requests, 2);
    });

    test('does not retain a context listener when disconnected during the initial request', async() => {
        let resolveInitial!: (response: { recommendations: SearchTermResult[] }) => void;
        const initialResponse = new Promise<{ recommendations: SearchTermResult[] }>(resolve => resolveInitial = resolve);
        Recommender.prototype.recommendPopularSearchTerms = async request => {
            requests.push(request);
            return initialResponse;
        };
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const element = await fixture<PopularSearchTerms>(html`
            <relewise-popular-search-terms displayed-at-location="test"></relewise-popular-search-terms>
        `);
        await waitUntil(() => requests.length === 1);

        element.remove();
        resolveInitial({ recommendations: [] });
        await initialResponse;
        window.dispatchEvent(new CustomEvent(Events.contextSettingsUpdated));
        await new Promise(resolve => setTimeout(resolve, 0));

        assert.lengthOf(requests, 1);
        assert.isNull(element.renderRoot.querySelector('[part="term"]'));
    });

    test('ignores an older response after a context update', async() => {
        let resolveInitial!: (response: { recommendations: SearchTermResult[] }) => void;
        const initialResponse = new Promise<{ recommendations: SearchTermResult[] }>(resolve => resolveInitial = resolve);
        Recommender.prototype.recommendPopularSearchTerms = async request => {
            requests.push(request);
            return requests.length === 1
                ? initialResponse
                : { recommendations: [{ term: 'Current', rank: 1 }] as SearchTermResult[] };
        };
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();
        const element = await fixture<PopularSearchTerms>(html`
            <relewise-popular-search-terms displayed-at-location="test"></relewise-popular-search-terms>
        `);
        await waitUntil(() => requests.length === 1);

        window.dispatchEvent(new CustomEvent(Events.contextSettingsUpdated));
        await waitUntil(() => element.renderRoot.querySelector('[part="term"]')?.textContent?.trim() === 'Current');
        resolveInitial({ recommendations: [{ term: 'Stale', rank: 1 }] as SearchTermResult[] });
        await initialResponse;
        await new Promise(resolve => setTimeout(resolve, 0));

        assert.equal(element.renderRoot.querySelector('[part="term"]')?.textContent?.trim(), 'Current');
    });
});
