import { assert, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import { ContentRecommendationResponse, ContentResult, Recommender, type ContentRecommendationRequest } from '@relewise/client';
import { PersonalContent, initializeRelewiseUI } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('relewise-personal-content', () => {
    const originalRecommendPersonalContents = Recommender.prototype.recommendPersonalContents;
    let recommendPersonalContentsCalls: ContentRecommendationRequest[];

    setup(() => {
        recommendPersonalContentsCalls = [];
    });

    teardown(() => {
        Recommender.prototype.recommendPersonalContents = originalRecommendPersonalContents;
        fixtureCleanup();
        window.relewiseUIOptions = undefined!;
    });

    test('is not instance of when relewise not instantiated', async () => {
        const el = await fixture(html`<relewise-personal-content displayed-at-location="test"></relewise-personal-content>`);
        assert.notInstanceOf(el, PersonalContent);
    });

    test('is instance of when relewise is instantiated', async () => {
        Recommender.prototype.recommendPersonalContents = async (request: ContentRecommendationRequest) => {
            recommendPersonalContentsCalls.push(request);
            return undefined;
        };

        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();

        const el = await fixture(html`<relewise-personal-content displayed-at-location="test"></relewise-personal-content>`);
        assert.instanceOf(el, PersonalContent);
        await new Promise(r => setTimeout(r, 0)); // Wait for component to finish rendering
        assert.equal(recommendPersonalContentsCalls.length, 1);
    });

    test('renders nothing when recommendations return empty result', async () => {
        Recommender.prototype.recommendPersonalContents = async (request: ContentRecommendationRequest) => {
            recommendPersonalContentsCalls.push(request);
            return {
                recommendations: [],
            } as ContentRecommendationResponse;
        };

        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();

        const el = await fixture(html`<relewise-personal-content displayed-at-location="test"></relewise-personal-content>`) as PersonalContent;
        await el.updateComplete;

        assert.shadowDom.equal(el, '');
        await new Promise(r => setTimeout(r, 0)); // Wait for component to finish rendering
        assert.equal(recommendPersonalContentsCalls.length, 1);
    });

    test('requests and renders numberOfRecommendations', async () => {
        const numberOfRecommendations = 2;
        const recommendations: ContentResult[] = [
            {
                displayName: 'First content',
                data: {},
            } as ContentResult,
            {
                displayName: 'Second content',
                data: {},
            } as ContentResult,
        ];

        Recommender.prototype.recommendPersonalContents = async (request: ContentRecommendationRequest) => {
            recommendPersonalContentsCalls.push(request);
            return {
                recommendations: recommendations.slice(0, request.settings.numberOfRecommendations),
            } as ContentRecommendationResponse;
        };

        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();

        const el = await fixture(html`<relewise-personal-content
            displayed-at-location="test"
            number-of-recommendations=${numberOfRecommendations}>
        </relewise-personal-content>`) as PersonalContent;

        await waitUntil(() => recommendPersonalContentsCalls.length > 0, 'recommendPersonalContents was never called', { timeout: 2000 });

        const request = recommendPersonalContentsCalls[0];
        assert.equal(request.settings.numberOfRecommendations, numberOfRecommendations);

        await waitUntil(() => el.shadowRoot?.querySelectorAll('relewise-content-tile').length === numberOfRecommendations,
            'never rendered the expected number of content tiles',
            { timeout: 2000 });

        assert.equal(el.shadowRoot?.querySelectorAll('relewise-content-tile').length, numberOfRecommendations);
    });
});
