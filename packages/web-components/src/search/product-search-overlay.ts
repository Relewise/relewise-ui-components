import { ProductResult, ProductSearchResponse, RedirectResult, SearchCollectionBuilder, SearchTermPredictionBuilder, SearchTermPredictionResponse, SearchTermPredictionResult } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { getRelewiseContextSettings, getRelewiseUIOptions, getRelewiseUISearchOptions } from '../helpers/relewiseUIOptions';
import { getSearcher } from './searcher';
import { theme } from '../theme';
import { createProductSearchBuilder } from '../builders';

export class SearchResult {
    product?: ProductResult;
    searchTermPrediction?: SearchTermPredictionResult;
    redirect?: RedirectResult;
    showAllResults?: boolean = false;
}

export class ProductSearchOverlay extends LitElement {

    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string = undefined;

    @property({ type: Number, attribute: 'number-of-products' })
    numberOfProducts: number = 5;

    @property({ type: Number, attribute: 'number-of-search-term-predictions' })
    numberOfSearchTermPredictions: number = 3;

    @property({ attribute: 'search-page-url' })
    searchPageUrl?: string = undefined;

    @state()
    results: SearchResult[] | null = null;

    @state()
    redirects?: RedirectResult[] | null = null;

    @state()
    term: string = '';

    @state()
    selectedIndex = -1;

    @state()
    searchBarInFocus: boolean = false;

    @state()
    resultBoxIsHovered: boolean = false;

    @state()
    hasCompletedSearchRequest: boolean = false;

    @state()
    productSearchResultHits: number = 0;

    private debounceTimeoutHandlerId: ReturnType<typeof setTimeout> | null = null;
    private abortController = new AbortController();

    async connectedCallback() {
        if (!this.displayedAtLocation) {
            console.error('No displayedAtLocation defined!');
        }
        super.connectedCallback();
    }

    setSearchTerm(term: string) {
        this.term = term;
        this.selectedIndex = -1;

        if (!term) {
            this.results = null;
            this.hasCompletedSearchRequest = false;
            return;
        }

        if (this.debounceTimeoutHandlerId) {
            clearTimeout(this.debounceTimeoutHandlerId);
        }

        this.debounceTimeoutHandlerId = setTimeout(() => {
            this.search(term);
        }, getRelewiseUISearchOptions()?.debounceTimeInMs);
    }

    handleKeyDown(event: KeyboardEvent): void {
        if (!this.results) {
            return;
        }

        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, this.results.length - 1);
                break;
            case 'Tab':
                event.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, this.results.length - 1);
                break;
            case 'Enter':
                event.preventDefault();
                this.handleActionOnResult(this.results[this.selectedIndex]);
                break;
        }
    }

    redirectToSearchPage() {
        if (!this.searchPageUrl) return;
        const url = new URL(this.searchPageUrl, window.location.href);
        url.searchParams.set('rw-term', this.term);
        window.location.href = url.toString();
    }

    handleActionOnResult(result?: SearchResult) {
        if (result?.showAllResults === true) {
            if (!this.searchPageUrl) return;
            this.redirectToSearchPage();
        } else if (result?.searchTermPrediction) {
            this.setSearchTerm(result.searchTermPrediction.term ?? '');
        } else if (result?.product) {
            const selectedProduct = this.shadowRoot!
                .querySelector('relewise-product-search-overlay-results')
                ?.shadowRoot
                ?.querySelector('.rw-selected-result[selected]');

            if (selectedProduct) {
                const productLink = selectedProduct
                    .querySelector('relewise-product-search-overlay-product')
                    ?.shadowRoot
                    ?.querySelector('a')
                    ?.getAttribute('href');

                if (productLink) {
                    window.location.href = productLink;
                }
            }
        } else if (result?.redirect) {
            // We have valided previous the the destination is a valid URL.
            window.location.href = result?.redirect.destination ?? '';
        } else if (this.redirects && this.redirects.length > 0 && URL.canParse(this.redirects[0].destination ?? '')) {
            if (this.redirects[0].destination) {
                window.location.href = this.redirects[0].destination;
            }
        } else if ((!result && this.searchPageUrl)) {
            this.redirectToSearchPage();
        }
    }

    async search(searchTerm: string) {
        this.abortController.abort();

        const relewiseUIOptions = getRelewiseUIOptions();
        const settings = getRelewiseContextSettings(this.displayedAtLocation ? this.displayedAtLocation : 'Relewise Product Search Overlay');
        const searcher = getSearcher(relewiseUIOptions);
        const requestBuilder = new SearchCollectionBuilder()
            .addRequest(createProductSearchBuilder(this.term, settings.displayedAtLocation)
                .pagination(p => p.setPageSize(this.numberOfProducts))
                .build());

        if (this.numberOfSearchTermPredictions > 0) {
            requestBuilder.addRequest(new SearchTermPredictionBuilder(settings)
                .setTerm(searchTerm)
                .take(this.numberOfSearchTermPredictions)
                .addEntityType('Product')
                .build());
        }

        this.abortController = new AbortController();
        const response = await searcher.batch(requestBuilder.build(), { abortSignal: this.abortController.signal });
        if (response && response.responses) {
            const productSearchResult = response.responses[0] as ProductSearchResponse;
            this.productSearchResultHits = productSearchResult.hits;
            const products = productSearchResult.results?.map(result => {
                const searchResult = new SearchResult();
                searchResult.product = result;
                return searchResult;
            }) ?? [];
            this.redirects = productSearchResult.redirects;
            const redirects: SearchResult[] = productSearchResult.redirects?.filter(x => x.data?.Title && URL.canParse(x.destination ?? '')).map(x => ({ redirect: x })) ?? [];

            const searchTermPredictionResult = response.responses[1] as SearchTermPredictionResponse;
            const searchTermPredictions = searchTermPredictionResult.predictions?.map(result => {
                const searchResult = new SearchResult();
                searchResult.searchTermPrediction = result;
                return searchResult;
            }) ?? [];

            this.results = redirects.concat(searchTermPredictions).concat(products);

            if (this.searchPageUrl && productSearchResult.hits > 0) this.results.push({ showAllResults: true });

            this.hasCompletedSearchRequest = true;
        }
    }

    render() {
        const localization = getRelewiseUISearchOptions()?.localization;
        return html`
            <relewise-search-bar 
                part="searchbar"
                exportparts="input: searchbar-input, icon: searchbar-icon"
                .term=${this.term}
                .setSearchTerm=${(term: string) => this.setSearchTerm(term)}
                .setSearchBarInFocus=${(inFocus: boolean) => this.searchBarInFocus = true}
                .placeholder=${localization?.searchBar?.placeholder ?? 'Search'}
                .handleKeyEvent=${(e: KeyboardEvent) => this.handleKeyDown(e)}
                ></relewise-search-bar>    
            ${(this.searchBarInFocus &&
                this.hasCompletedSearchRequest &&
                this.term) ||
                this.resultBoxIsHovered ?
                html`<relewise-product-search-overlay-results
                    part="overlay"
                    exportparts="overlay: overlay-container"
                    .selectedIndex=${this.selectedIndex}
                    .results=${this.results} 
                    .setSearchTerm=${(term: string) => this.setSearchTerm(term)}
                    .redirectToSearchPage=${() => this.redirectToSearchPage()}
                    .noResultsMessage=${localization?.searchResults?.noResults ?? 'No products found'}
                    .setResultOverlayHovered=${(hovered: boolean) => this.resultBoxIsHovered = hovered}
                    .hits=${this.productSearchResultHits}>
                    </relewise-product-search-overlay-results> ` : nothing
            }
        `;
    }

    static styles = [
        theme,
        css`
        :host {
            position: relative;
            font-family: var(--font);
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-search-overlay': ProductSearchOverlay;
    }
}