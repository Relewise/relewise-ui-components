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
    return element.renderRoot.querySelector('relewise-search-combobox')! as RenderableElement;
}

function suggestionsRoot(element: UniversalSearch): HTMLElement | DocumentFragment {
    return searchBar(element).renderRoot;
}

suite('universal search suggestions', () => {
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

    test('shows popular search terms only while the empty input is focused', async() => {
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
                suggestions: {
                    popularSearchTerms: { take: 2 },
                },
            },
        });

        const element = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        await waitUntil(() => suggestionsRoot(element).querySelectorAll('[part~="suggestion"]').length === 2, 'popular search terms were not rendered');

        const suggestions = suggestionsRoot(element).querySelector('[part~="search-suggestions"]');
        assert.include(suggestions?.getAttribute('part') ?? '', 'popular-search-terms');

        const input = suggestionsRoot(element).querySelector('input')!;
        element.renderRoot.querySelector('[part="empty-state"]')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
        await element.updateComplete;

        assert.isNull(suggestionsRoot(element).querySelector('[part~="search-suggestions"]'));

        input.blur();
        input.focus();
        await waitUntil(() => suggestionsRoot(element).querySelector('[part~="search-suggestions"]') !== null, 'popular search terms did not return on focus');
        input.blur();
        await element.updateComplete;

        assert.isNull(suggestionsRoot(element).querySelector('[part~="search-suggestions"]'));
    });

    test('renders the suggestions popup with rounded corners and no outer list whitespace', async() => {
        Recommender.prototype.recommendPopularSearchTerms = async function() {
            return { recommendations: [{ term: 'Running shoes', rank: 1 }] } as any;
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {} },
                suggestions: {
                    popularSearchTerms: {},
                },
            },
        });

        const element = await fixture(html`
            <relewise-universal-search
                displayed-at-location="Universal Search"
                style="--relewise-search-suggestions-border-radius: 12px"
                open>
            </relewise-universal-search>
        `) as UniversalSearch;

        await waitUntil(() => suggestionsRoot(element).querySelector('[part~="search-suggestions"]') !== null, 'suggestions were not rendered');

        const suggestions = suggestionsRoot(element).querySelector<HTMLElement>('[part~="search-suggestions"]')!;
        const list = suggestionsRoot(element).querySelector<HTMLElement>('[part="suggestions-list"]')!;
        const suggestionsStyle = getComputedStyle(suggestions);
        const listStyle = getComputedStyle(list);

        assert.equal(suggestionsStyle.borderRadius, '12px');
        assert.equal(suggestionsStyle.overflow, 'hidden');
        assert.notEqual(suggestionsStyle.boxShadow, 'none');
        assert.equal(listStyle.paddingTop, '0px');
        assert.equal(listStyle.paddingBottom, '0px');
    });

    test('keeps the combobox and close button aligned when the shared height is customized', async() => {
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            universalSearch: {
                entities: { products: {} },
            },
        });

        const element = await fixture(html`
            <relewise-universal-search
                displayed-at-location="Universal Search"
                style="--relewise-search-combobox-height: 42px; --relewise-product-search-bar-height: 17px"
                open>
            </relewise-universal-search>
        `) as UniversalSearch;

        const comboboxInput = suggestionsRoot(element).querySelector<HTMLElement>('.rw-search-bar')!;
        const closeButton = element.renderRoot.querySelector<HTMLElement>('[part="close-button"]')!;

        assert.equal(comboboxInput.getBoundingClientRect().height, 42);
        assert.equal(closeButton.getBoundingClientRect().height, 42);
    });

    test('uses the Universal Search location for popular terms when the attribute is omitted', async() => {
        let displayedAtLocation: string | undefined;
        Recommender.prototype.recommendPopularSearchTerms = async function(request) {
            displayedAtLocation = request.displayedAtLocationType;
            return { recommendations: [{ term: 'Running shoes', rank: 1 }] } as any;
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            universalSearch: {
                entities: { products: {} },
                suggestions: {
                    popularSearchTerms: {},
                },
            },
        });

        const element = await fixture(html`
            <relewise-universal-search open></relewise-universal-search>
        `) as UniversalSearch;

        await waitUntil(() => suggestionsRoot(element).querySelector('[part~="suggestion"]') !== null, 'popular search term was not rendered');

        assert.equal(displayedAtLocation, 'Relewise Universal Search');
    });

    test('does not render an empty suggestions panel', async() => {
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
                suggestions: {
                    popularSearchTerms: {},
                },
            },
        });

        const element = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        await waitUntil(() => requestCompleted, 'popular search terms request did not complete');
        await element.updateComplete;

        assert.isNull(suggestionsRoot(element).querySelector('[part~="search-suggestions"]'));
    });

    test('renders suggestions in light DOM mode', async() => {
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
                suggestions: {
                    popularSearchTerms: {},
                },
            },
        });

        const element = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        await waitUntil(
            () => suggestionsRoot(element).querySelector('[part~="suggestion"]') !== null,
            'popular search term was not rendered in light DOM',
        );

        assert.isNull(element.shadowRoot);
        assert.isNull(searchBar(element).shadowRoot);
    });

    test('renders API predictions without changing them', async() => {
        let predictionEntityTypes: string[] | null | undefined;
        let predictionTerm: string | undefined;

        Searcher.prototype.searchTermPrediction = async function(request) {
            predictionEntityTypes = request.settings?.targetEntityTypes;
            predictionTerm = request.term;
            return searchTermPredictionResponse(['shoe', 'Shoe rack', ' Shoe ', 'shoe RACK']);
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {}, content: {} },
                suggestions: {
                    searchTermPredictions: {
                        targetEntityTypes: ['Product'],
                    },
                },
            },
            localization: {
                searchSuggestions: {
                    label: 'Søgeforslag',
                },
            },
        });

        const element = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;
        const input = suggestionsRoot(element).querySelector('input')! as HTMLInputElement;

        input.value = ' Shoe ';
        input.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));

        await waitUntil(() => suggestionsRoot(element).querySelectorAll('[part~="suggestion"]').length === 3, 'predictions were not rendered');

        assert.deepEqual(predictionEntityTypes, ['Product']);
        assert.equal(predictionTerm, ' Shoe ');
        assert.deepEqual(
            [...suggestionsRoot(element).querySelectorAll('[part~="suggestion"]')].map(item => item.textContent?.trim()),
            ['shoe', 'Shoe rack', 'shoe RACK'],
        );
        assert.include(suggestionsRoot(element).querySelector('[part~="search-suggestions"]')?.getAttribute('part') ?? '', 'predictions');

        const listbox = suggestionsRoot(element).querySelector('[part="suggestions-list"]')!;
        assert.equal(listbox.getAttribute('role'), 'listbox');
        assert.equal(listbox.getAttribute('aria-label'), 'Søgeforslag');
        assert.equal(listbox.querySelector('li')?.getAttribute('role'), 'none');
        assert.equal(input.getAttribute('role'), 'combobox');
        assert.equal(input.getAttribute('aria-autocomplete'), 'list');
        assert.equal(input.getAttribute('aria-expanded'), 'true');
        assert.equal(input.getAttribute('aria-controls'), listbox.id);
    });

    test('matches prediction responses by their exact response type', async() => {
        Searcher.prototype.batch = async function() {
            return {
                responses: [
                    {
                        $type: 'Example.SearchTermPredictionResponse.Lookalike',
                        predictions: [{ term: 'Wrong prediction', rank: 1 }],
                    },
                    searchTermPredictionResponse(['Right prediction']),
                    productSearchResponse(),
                ],
            } as any;
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {} },
                suggestions: {
                    searchTermPredictions: {},
                },
            },
        });

        const element = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;
        const input = suggestionsRoot(element).querySelector('input')! as HTMLInputElement;

        input.value = 'prediction';
        input.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));

        await waitUntil(() => suggestionsRoot(element).querySelector('[part~="suggestion"]') !== null, 'prediction was not rendered');

        assert.deepEqual(
            [...suggestionsRoot(element).querySelectorAll('[part~="suggestion"]')].map(item => item.textContent?.trim()),
            ['Right prediction'],
        );
    });

    test('selects predictions with the keyboard and dismisses the suggestions panel', async() => {
        Searcher.prototype.searchTermPrediction = async function() {
            return searchTermPredictionResponse(['Running shoes', 'Trail shoes']);
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {} },
                suggestions: {
                    searchTermPredictions: { take: 2 },
                },
            },
        });

        const element = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;
        const input = suggestionsRoot(element).querySelector('input')! as HTMLInputElement;

        input.value = 'shoe';
        input.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
        await waitUntil(() => suggestionsRoot(element).querySelectorAll('[part~="suggestion"]').length === 2, 'predictions were not rendered');

        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, composed: true }));
        await waitUntil(() => suggestionsRoot(element).querySelector('[aria-selected="true"]') !== null, 'prediction was not selected');

        let selectedOption = suggestionsRoot(element).querySelector('[aria-selected="true"]')!;
        assert.equal(selectedOption.textContent?.trim(), 'Trail shoes');
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, composed: true }));
        await element.updateComplete;

        selectedOption = suggestionsRoot(element).querySelector('[aria-selected="true"]')!;
        assert.equal(selectedOption.textContent?.trim(), 'Running shoes');
        assert.equal(input.getAttribute('aria-activedescendant'), selectedOption.id);

        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
        await element.updateComplete;

        assert.equal((element as unknown as UniversalSearchTestApi).term, 'Running shoes');
        assert.isNull(suggestionsRoot(element).querySelector('[part~="search-suggestions"]'));
        assert.equal(input.getAttribute('aria-expanded'), 'false');
        assert.isNull(input.getAttribute('aria-controls'));
        assert.isNull(input.getAttribute('aria-activedescendant'));
        assert.isTrue(element.isOpen);
    });

    test('does not repeat a completed search when Enter dismisses suggestions', async() => {
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
                suggestions: {
                    searchTermPredictions: {},
                },
            },
        });

        const element = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;
        const input = suggestionsRoot(element).querySelector('input')! as HTMLInputElement;

        input.value = 'shoe';
        input.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
        await waitUntil(() => searchRequestCount === 1, 'initial search did not complete');
        await waitUntil(() => suggestionsRoot(element).querySelector('[part~="search-suggestions"]') !== null, 'predictions were not rendered');

        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
        await new Promise(resolve => setTimeout(resolve, 10));

        assert.equal(searchRequestCount, 1);
        assert.isNull(suggestionsRoot(element).querySelector('[part~="search-suggestions"]'));
    });

    test('selects popular search terms after touch pointer down and hides the suggestions panel', async() => {
        Recommender.prototype.recommendPopularSearchTerms = async function() {
            return { recommendations: [{ term: 'Running shoes', rank: 1 }] } as any;
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch({
            debounceTimeInMs: 0,
            universalSearch: {
                entities: { products: {} },
                suggestions: {
                    popularSearchTerms: {},
                },
            },
        });

        const element = await fixture(html`
            <relewise-universal-search displayed-at-location="Universal Search" open></relewise-universal-search>
        `) as UniversalSearch;

        await waitUntil(() => suggestionsRoot(element).querySelector('[part~="suggestion"]') !== null, 'popular search term was not rendered');
        const suggestion = suggestionsRoot(element).querySelector('[part~="suggestion"]') as HTMLButtonElement;
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
        assert.isNull(suggestionsRoot(element).querySelector('[part~="search-suggestions"]'));
        await waitUntil(() => readCurrentUrlState(QueryKeys.term) === 'Running shoes', 'selected popular term was not searched');
    });

    test('preserves the existing search behavior when suggestions are not configured', async() => {
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
        const input = suggestionsRoot(element).querySelector('input')! as HTMLInputElement;

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
