import { assert, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import { Recommender } from '@relewise/client';
import { getRelewiseContextSettings, initializeRelewiseUI, SearchCombobox, useSearch } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('relewise-search-combobox', () => {
    const originalRecommendPopularSearchTerms = Recommender.prototype.recommendPopularSearchTerms;

    teardown(() => {
        fixtureCleanup();
        window.relewiseUISearchOptions = undefined!;
        window.relewiseUIOptions = undefined!;
        Recommender.prototype.recommendPopularSearchTerms = originalRecommendPopularSearchTerms;
    });

    test('can load suggestions without Universal Search configuration', async() => {
        let targetEntityTypes: string[] | null | undefined;
        let displayedAtLocation: string | undefined;
        Recommender.prototype.recommendPopularSearchTerms = async function(request) {
            targetEntityTypes = request.settings?.targetEntityTypes;
            displayedAtLocation = request.displayedAtLocationType;
            return { recommendations: [{ term: 'Guides', rank: 1 }] } as any;
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch();

        const element = await fixture(html`
            <relewise-search-combobox
                displayed-at-location="Standalone search"
                style="--relewise-search-combobox-height: 42px; --relewise-product-search-bar-height: 17px"
                .suggestions=${{ popularSearchTerms: {} }}
                .targetEntityTypes=${['Content']}
                autofocus>
            </relewise-search-combobox>
        `) as SearchCombobox;

        await waitUntil(() => element.renderRoot.querySelector('[part~="suggestion"]') !== null, 'standalone suggestions were not rendered');

        assert.deepEqual(targetEntityTypes, ['Content']);
        assert.equal(displayedAtLocation, 'Standalone search');
        assert.equal(getComputedStyle(element.renderRoot.querySelector<HTMLElement>('.rw-search-bar')!).height, '42px');
        assert.equal(element.renderRoot.querySelector('[part~="suggestion"]')?.textContent?.trim(), 'Guides');
        assert.isUndefined(window.relewiseUISearchOptions.universalSearch);
    });

    test('exposes prediction request and response handling for a parent search batch', async() => {
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch();

        const element = await fixture(html`
            <relewise-search-combobox
                displayed-at-location="Standalone search"
                .term=${'shoe'}
                .suggestions=${{ searchTermPredictions: { take: 3 } }}
                .targetEntityTypes=${['Product', 'Content']}
                autofocus>
            </relewise-search-combobox>
        `) as SearchCombobox;
        const settings = await getRelewiseContextSettings('Standalone search');
        const predictionSearch = element.prepareBatchSearch(settings);

        assert.isNotNull(predictionSearch);
        assert.equal(predictionSearch?.request.term, 'shoe');
        assert.equal(predictionSearch?.request.take, 3);
        assert.deepEqual(predictionSearch?.request.settings?.targetEntityTypes, ['Product', 'Content']);

        predictionSearch?.applyResponse({
            responses: [{
                $type: 'Relewise.Client.Responses.Search.SearchTermPredictionResponse, Relewise.Client',
                predictions: [{ term: 'Shoes', rank: 1 }],
            }],
        } as any);
        await element.updateComplete;

        assert.equal(element.renderRoot.querySelector('[part~="suggestion"]')?.textContent?.trim(), 'Shoes');
    });
});
