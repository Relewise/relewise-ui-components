import { assert, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import { Recommender } from '@relewise/client';
import {
    getRelewiseContextSettings,
    initializeRelewiseUI,
    SearchCombobox,
    SearchComboboxEvents,
    SearchComboboxRedirectEventDetail,
    SearchComboboxTermEventDetail,
    useSearch,
} from '../src';
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
                .suggestions=${{ popularSearchTerms: { targetEntityTypes: ['Product'] } }}
                .targetEntityTypes=${['Content']}
                autofocus>
            </relewise-search-combobox>
        `) as SearchCombobox;

        await waitUntil(() => element.renderRoot.querySelector('[part~="suggestion"]') !== null, 'standalone suggestions were not rendered');

        assert.deepEqual(targetEntityTypes, ['Product']);
        assert.equal(displayedAtLocation, 'Standalone search');
        assert.equal(getComputedStyle(element.renderRoot.querySelector<HTMLElement>('.rw-search-bar')!).height, '42px');
        assert.isNotNull(element.renderRoot.querySelector('[part~="search-input"]'));
        assert.equal(element.renderRoot.querySelector('relewise-search-icon')?.getAttribute('exportparts'), 'icon: search-icon');
        assert.equal(element.renderRoot.querySelector('[part~="suggestion"]')?.textContent?.trim(), 'Guides');
        assert.isNotNull(element.renderRoot.querySelector('[part~="suggestion-icon"]'));
        assert.isUndefined(window.relewiseUISearchOptions.universalSearch);
    });

    test('updates its term and dispatches public interaction events', async() => {
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch();

        const element = await fixture(html`
            <relewise-search-combobox></relewise-search-combobox>
        `) as SearchCombobox;
        const input = element.renderRoot.querySelector('input')!;
        let changedTerm: string | null = null;
        let submittedTerm: string | null = null;
        let escapeRequested = false;

        element.addEventListener(SearchComboboxEvents.termChanged, (event: CustomEvent<SearchComboboxTermEventDetail>) => {
            changedTerm = event.detail.term;
        });
        element.addEventListener(SearchComboboxEvents.searchSubmitted, (event: CustomEvent<SearchComboboxTermEventDetail>) => {
            submittedTerm = event.detail.term;
        });
        element.addEventListener(SearchComboboxEvents.escapeRequested, () => escapeRequested = true);

        input.value = 'shoes';
        input.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
        await element.updateComplete;

        assert.equal(element.term, 'shoes');
        assert.equal(changedTerm, 'shoes');
        assert.equal(submittedTerm, 'shoes');
        assert.isTrue(escapeRequested);
    });

    (['shadow', 'light'] as const).forEach(domMode => {
        test(`clears the term with an accessible button and restores input focus in ${domMode} DOM`, async() => {
            const options = mockRelewiseOptions();
            options.components = { domMode };
            initializeRelewiseUI(options);
            useSearch({ localization: { searchBar: { clear: 'Clear the search' } } });

            const element = await fixture(html`
                <relewise-search-combobox .term=${'shoes'}></relewise-search-combobox>
            `) as SearchCombobox;
            let changedTerm: string | null = null;
            element.addEventListener(SearchComboboxEvents.termChanged, (event: CustomEvent<SearchComboboxTermEventDetail>) => {
                changedTerm = event.detail.term;
            });
            const input = element.renderRoot.querySelector<HTMLInputElement>('input')!;
            const clearButton = element.renderRoot.querySelector<HTMLButtonElement>('[part~="clear-search"]')!;

            assert.equal(clearButton.tagName, 'BUTTON');
            assert.equal(clearButton.type, 'button');
            assert.equal(clearButton.getAttribute('aria-label'), 'Clear the search');
            assert.isAtLeast(clearButton.getBoundingClientRect().width, 44);
            assert.isAtLeast(clearButton.getBoundingClientRect().height, 44);

            clearButton.click();
            await element.updateComplete;

            assert.equal(element.term, '');
            assert.equal(changedTerm, '');
            assert.equal(element.shadowRoot?.activeElement ?? document.activeElement, input);
            assert.isNull(element.renderRoot.querySelector('[part~="clear-search"]'));
        });
    });

    test('renders titled valid redirects and emits their destination when selected', async() => {
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch();

        const element = await fixture(html`
            <relewise-search-combobox
                .term=${'shoe'}
                .redirects=${[
                    { destination: '#campaign', data: { Title: 'Campaign' } },
                    { destination: '#hidden' },
                    { destination: 'https://[invalid', data: { Title: 'Invalid' } },
                ]}
                autofocus>
            </relewise-search-combobox>
        `) as SearchCombobox;
        let destination: string | null = null;
        element.addEventListener(SearchComboboxEvents.redirectSelected, (event: CustomEvent<SearchComboboxRedirectEventDetail>) => {
            destination = event.detail.destination;
        });

        await waitUntil(() => element.renderRoot.querySelector('[part~="suggestion"]') !== null, 'redirect suggestion was not rendered');
        const suggestions = [...element.renderRoot.querySelectorAll<HTMLButtonElement>('[part~="suggestion"]')];

        assert.deepEqual(suggestions.map(suggestion => suggestion.textContent?.trim()), ['Campaign']);
        assert.isNotNull(suggestions[0].querySelector('relewise-arrow-up-icon'));
        assert.isNull(suggestions[0].querySelector('relewise-search-icon'));
        suggestions[0].click();
        assert.equal(destination, '#campaign');
    });

    test('dismisses suggestions when interacting outside the standalone combobox', async() => {
        Recommender.prototype.recommendPopularSearchTerms = async function() {
            return { recommendations: [{ term: 'Guides', rank: 1 }] } as any;
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch();

        const element = await fixture(html`
            <relewise-search-combobox
                .suggestions=${{ popularSearchTerms: {} }}
                .targetEntityTypes=${['Content']}
                autofocus>
            </relewise-search-combobox>
        `) as SearchCombobox;

        await waitUntil(() => element.renderRoot.querySelector('[part~="suggestion"]') !== null, 'standalone suggestions were not rendered');
        document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
        await element.updateComplete;

        assert.isNull(element.renderRoot.querySelector('[part~="search-suggestions"]'));
    });

    test('does not reload completed empty popular search terms when refocused', async() => {
        let requests = 0;
        let requestCompleted = false;
        Recommender.prototype.recommendPopularSearchTerms = async function() {
            requests++;
            requestCompleted = true;
            return { recommendations: [] } as any;
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch();

        const element = await fixture(html`
            <relewise-search-combobox
                .suggestions=${{ popularSearchTerms: {} }}
                .targetEntityTypes=${['Content']}
                autofocus>
            </relewise-search-combobox>
        `) as SearchCombobox;
        const input = element.renderRoot.querySelector('input')!;

        await waitUntil(() => requestCompleted, 'popular search term request did not complete');
        input.blur();
        input.focus();
        await new Promise(resolve => setTimeout(resolve, 10));

        assert.equal(requests, 1);
    });

    test('exposes prediction request and response handling for a parent search batch', async() => {
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch();

        const element = await fixture(html`
            <relewise-search-combobox
                displayed-at-location="Standalone search"
                .term=${'shoe'}
                .suggestions=${{ searchTermPredictions: { take: 3, targetEntityTypes: ['Product'] } }}
                .targetEntityTypes=${['Product', 'Content']}
                autofocus>
            </relewise-search-combobox>
        `) as SearchCombobox;
        const settings = await getRelewiseContextSettings('Standalone search');
        const predictionSearch = element.prepareBatchSearch(settings);

        assert.isNotNull(predictionSearch);
        assert.equal(predictionSearch?.request.term, 'shoe');
        assert.equal(predictionSearch?.request.take, 3);
        assert.deepEqual(predictionSearch?.request.settings?.targetEntityTypes, ['Product']);

        element.suggestions = { searchTermPredictions: { take: 3 } };
        const fallbackPredictionSearch = element.prepareBatchSearch(settings);
        assert.deepEqual(fallbackPredictionSearch?.request.settings?.targetEntityTypes, ['Product', 'Content']);

        predictionSearch?.applyResponse({
            responses: [{
                $type: 'Relewise.Client.Responses.Search.SearchTermPredictionResponse, Relewise.Client',
                predictions: [{ term: 'Shoes', rank: 1 }],
            }],
        } as any);
        await element.updateComplete;

        assert.equal(element.renderRoot.querySelector('[part~="suggestion"]')?.textContent?.trim(), 'Shoes');
    });

    test('ignores outdated prediction responses', async() => {
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch();

        const element = await fixture(html`
            <relewise-search-combobox
                .term=${'shoe'}
                .suggestions=${{ searchTermPredictions: {} }}
                .targetEntityTypes=${['Product']}
                autofocus>
            </relewise-search-combobox>
        `) as SearchCombobox;
        const settings = await getRelewiseContextSettings('Standalone search');
        const predictionSearch = element.prepareBatchSearch(settings);
        const input = element.renderRoot.querySelector('input')!;
        const response = {
            responses: [{
                $type: 'Relewise.Client.Responses.Search.SearchTermPredictionResponse, Relewise.Client',
                predictions: [{ term: 'Shoe rack', rank: 1 }],
            }],
        } as any;

        input.value = 'shoes';
        input.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
        predictionSearch?.applyResponse(response);
        await element.updateComplete;

        assert.isNull(element.renderRoot.querySelector('[part~="suggestion"]'));

        const currentPredictionSearch = element.prepareBatchSearch(settings);
        document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
        currentPredictionSearch?.applyResponse(response);
        await element.updateComplete;

        assert.isNull(element.renderRoot.querySelector('[part~="suggestion"]'));
    });
});
