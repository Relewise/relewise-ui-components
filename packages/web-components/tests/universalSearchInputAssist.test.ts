import { assert, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import { Recommender, Searcher } from '@relewise/client';
import { clearUrlState, initializeRelewiseUI, QueryKeys, readCurrentUrlState, UniversalSearch, useSearch } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

type UniversalSearchTestApi = {
    term: string;
};

type RenderableElement = HTMLElement & {
    renderRoot: HTMLElement | DocumentFragment;
    updateComplete: Promise<boolean>;
};

function productSearchResponse() {
    return {
        $type: 'Relewise.Client.Responses.Search.ProductSearchResponse, Relewise.Client',
        hits: 0,
        results: [],
        facets: null,
    } as any;
}

function searchTermPredictionResponse(terms: string[]) {
    return {
        $type: 'Relewise.Client.Responses.Search.SearchTermPredictionResponse, Relewise.Client',
        predictions: terms.map((term, rank) => ({ term, rank })),
    } as any;
}

function searchBar(element: UniversalSearch): RenderableElement {
    return element.renderRoot.querySelector('relewise-search-bar')! as RenderableElement;
}

function inputAssistRoot(element: UniversalSearch): HTMLElement | DocumentFragment {
    return searchBar(element).renderRoot;
}

suite('universal search Input Assist', () => {
    const originalRecommendPopularSearchTerms = Recommender.prototype.recommendPopularSearchTerms;
    const originalBatch = Searcher.prototype.batch;
    const originalSearchTermPrediction = Searcher.prototype.searchTermPrediction;

    setup(() => {
        clearUrlState();
        Recommender.prototype.recommendPopularSearchTerms = originalRecommendPopularSearchTerms;
        Searcher.prototype.searchTermPrediction = originalSearchTermPrediction;
        Searcher.prototype.batch = async function(requestCollection, options) {
            const responses = await Promise.all(requestCollection.requests.map(request => {
                if (request.$type.includes('SearchTermPredictionRequest')) {
                    return this.searchTermPrediction(request as any, options);
                }
                return productSearchResponse();
            }));

            return { responses: responses.filter(response => Boolean(response)) } as any;
        };
    });

    teardown(() => {
        clearUrlState();
        fixtureCleanup();
        window.relewiseUISearchOptions = undefined!;
        window.relewiseUIOptions = undefined!;
        Recommender.prototype.recommendPopularSearchTerms = originalRecommendPopularSearchTerms;
        Searcher.prototype.batch = originalBatch;
        Searcher.prototype.searchTermPrediction = originalSearchTermPrediction;
    });

    test('shows popular search terms only while the empty input is focused', async () => {
        Recommender.prototype.recommendPopularSearchTerms = async function() {
            return {
                recommendations: [
                    { term: 'Running shoes', rank: 1 },
                    { term: 'Summer jackets', rank: 2 },
                ],
            } as any;
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {} },
                inputAssist: {
                    popularSearchTerms: { take: 2 },
                },
            },
        });

        const element = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        await waitUntil(() => inputAssistRoot(element).querySelectorAll('[part~="input-assist-item"]').length === 2, 'popular search terms were not rendered');

        const assist = inputAssistRoot(element).querySelector('[part~="input-assist"]');
        assert.include(assist?.getAttribute('part') ?? '', 'popular-search-terms');

        const input = inputAssistRoot(element).querySelector('input')!;
        element.renderRoot.querySelector('[part="empty-state"]')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
        await element.updateComplete;

        assert.isNull(inputAssistRoot(element).querySelector('[part~="input-assist"]'));

        input.blur();
        input.focus();
        await waitUntil(() => inputAssistRoot(element).querySelector('[part~="input-assist"]') !== null, 'popular search terms did not return on focus');
        input.blur();
        await element.updateComplete;

        assert.isNull(inputAssistRoot(element).querySelector('[part~="input-assist"]'));
    });

    test('does not render an empty Input Assist panel', async () => {
        let requestCompleted = false;
        Recommender.prototype.recommendPopularSearchTerms = async function() {
            requestCompleted = true;
            return { recommendations: [] } as any;
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {} },
                inputAssist: {
                    popularSearchTerms: {},
                },
            },
        });

        const element = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        await waitUntil(() => requestCompleted, 'popular search terms request did not complete');
        await element.updateComplete;

        assert.isNull(inputAssistRoot(element).querySelector('[part~="input-assist"]'));
    });

    test('renders Input Assist in light DOM mode', async () => {
        Recommender.prototype.recommendPopularSearchTerms = async function() {
            return { recommendations: [{ term: 'Running shoes', rank: 1 }] } as any;
        };

        const options = mockRelewiseOptions();
        options.components = { domMode: 'light' };
        initializeRelewiseUI(options);
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {} },
                inputAssist: {
                    popularSearchTerms: {},
                },
            },
        });

        const element = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        await waitUntil(
            () => inputAssistRoot(element).querySelector('[part~="input-assist-item"]') !== null,
            'popular search term was not rendered in light DOM',
        );

        assert.isNull(element.shadowRoot);
        assert.isNull(searchBar(element).shadowRoot);
    });

    test('renders API predictions without changing them', async () => {
        let predictionEntityTypes: string[] | null | undefined;
        let predictionTerm: string | undefined;

        Searcher.prototype.searchTermPrediction = async function(request) {
            predictionEntityTypes = request.settings?.targetEntityTypes;
            predictionTerm = request.term;
            return searchTermPredictionResponse(['shoe', 'Shoe rack', 'shoe RACK']);
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {} },
                inputAssist: {
                    searchTermPredictions: {},
                },
            },
            localization: {
                universalSearch: {
                    inputAssistLabel: 'Søgeforslag',
                },
            },
        });

        const element = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;
        const input = inputAssistRoot(element).querySelector('input')! as HTMLInputElement;

        input.value = ' Shoe ';
        input.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));

        await waitUntil(() => inputAssistRoot(element).querySelectorAll('[part~="input-assist-item"]').length === 3, 'predictions were not rendered');

        assert.deepEqual(predictionEntityTypes, ['Product']);
        assert.equal(predictionTerm, ' Shoe ');
        assert.deepEqual(
            [...inputAssistRoot(element).querySelectorAll('[part~="input-assist-item"]')].map(item => item.textContent?.trim()),
            ['shoe', 'Shoe rack', 'shoe RACK'],
        );
        assert.include(inputAssistRoot(element).querySelector('[part~="input-assist"]')?.getAttribute('part') ?? '', 'predictions');

        const listbox = inputAssistRoot(element).querySelector('[part="input-assist-list"]')!;
        assert.equal(listbox.getAttribute('role'), 'listbox');
        assert.equal(listbox.getAttribute('aria-label'), 'Søgeforslag');
        assert.equal(listbox.querySelector('li')?.getAttribute('role'), 'none');
        assert.equal(input.getAttribute('role'), 'combobox');
        assert.equal(input.getAttribute('aria-autocomplete'), 'list');
        assert.equal(input.getAttribute('aria-expanded'), 'true');
        assert.equal(input.getAttribute('aria-controls'), listbox.id);
    });

    test('selects predictions with the keyboard and dismisses the assist panel', async () => {
        Searcher.prototype.searchTermPrediction = async function() {
            return searchTermPredictionResponse(['Running shoes', 'Trail shoes']);
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {} },
                inputAssist: {
                    searchTermPredictions: { take: 2 },
                },
            },
        });

        const element = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;
        const input = inputAssistRoot(element).querySelector('input')! as HTMLInputElement;

        input.value = 'shoe';
        input.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
        await waitUntil(() => inputAssistRoot(element).querySelectorAll('[part~="input-assist-item"]').length === 2, 'predictions were not rendered');

        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, composed: true }));
        await waitUntil(() => inputAssistRoot(element).querySelector('[aria-selected="true"]') !== null, 'prediction was not selected');

        let selectedOption = inputAssistRoot(element).querySelector('[aria-selected="true"]')!;
        assert.equal(selectedOption.textContent?.trim(), 'Trail shoes');
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, composed: true }));
        await element.updateComplete;

        selectedOption = inputAssistRoot(element).querySelector('[aria-selected="true"]')!;
        assert.equal(selectedOption.textContent?.trim(), 'Running shoes');
        assert.equal(input.getAttribute('aria-activedescendant'), selectedOption.id);

        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
        await element.updateComplete;

        assert.equal((element as unknown as UniversalSearchTestApi).term, 'Running shoes');
        assert.isNull(inputAssistRoot(element).querySelector('[part~="input-assist"]'));
        assert.equal(input.getAttribute('aria-expanded'), 'false');
        assert.isNull(input.getAttribute('aria-controls'));
        assert.isNull(input.getAttribute('aria-activedescendant'));
        assert.isTrue(element.isOpen);
    });

    test('does not repeat a completed search when Enter dismisses Input Assist', async () => {
        let searchRequestCount = 0;
        const batch = Searcher.prototype.batch;

        Searcher.prototype.batch = async function(requestCollection, options) {
            searchRequestCount++;
            return batch.call(this, requestCollection, options);
        };
        Searcher.prototype.searchTermPrediction = async function() {
            return searchTermPredictionResponse(['Running shoes']);
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {} },
                inputAssist: {
                    searchTermPredictions: {},
                },
            },
        });

        const element = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;
        const input = inputAssistRoot(element).querySelector('input')! as HTMLInputElement;

        input.value = 'shoe';
        input.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
        await waitUntil(() => searchRequestCount === 1, 'initial search did not complete');
        await waitUntil(() => inputAssistRoot(element).querySelector('[part~="input-assist"]') !== null, 'predictions were not rendered');

        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
        await new Promise(resolve => setTimeout(resolve, 10));

        assert.equal(searchRequestCount, 1);
        assert.isNull(inputAssistRoot(element).querySelector('[part~="input-assist"]'));
    });

    test('selects popular search terms after touch pointer down and hides the assist panel', async () => {
        Recommender.prototype.recommendPopularSearchTerms = async function() {
            return { recommendations: [{ term: 'Running shoes', rank: 1 }] } as any;
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {} },
                inputAssist: {
                    popularSearchTerms: {},
                },
            },
        });

        const element = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        await waitUntil(() => inputAssistRoot(element).querySelector('[part~="input-assist-item"]') !== null, 'popular search term was not rendered');
        const suggestion = inputAssistRoot(element).querySelector('[part~="input-assist-item"]') as HTMLButtonElement;
        const pointerDownWasNotCancelled = suggestion.dispatchEvent(new PointerEvent('pointerdown', {
            bubbles: true,
            cancelable: true,
            composed: true,
            pointerType: 'touch',
        }));
        assert.isFalse(pointerDownWasNotCancelled);
        suggestion.click();
        await element.updateComplete;

        assert.equal((element as unknown as UniversalSearchTestApi).term, 'Running shoes');
        assert.isNull(inputAssistRoot(element).querySelector('[part~="input-assist"]'));
        await waitUntil(() => readCurrentUrlState(QueryKeys.term) === 'Running shoes', 'selected popular term was not searched');
    });

    test('preserves the existing search bar behavior when Input Assist is not configured', async () => {
        let searchRequestCount = 0;

        Searcher.prototype.batch = async function() {
            searchRequestCount++;
            return { responses: [productSearchResponse()] } as any;
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 50,
            universalSearch: {
                entities: { products: {} },
            },
        });

        const element = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;
        const input = inputAssistRoot(element).querySelector('input')! as HTMLInputElement;

        input.value = 'shoe';
        input.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
        await new Promise(resolve => setTimeout(resolve, 10));

        assert.equal(searchRequestCount, 0);
        assert.isNull(input.getAttribute('role'));
        assert.isNull(input.getAttribute('aria-expanded'));

        await waitUntil(() => searchRequestCount === 1, 'debounced search did not complete');

        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
        await element.updateComplete;

        assert.isFalse(element.isOpen);
    });
});
