import { ProductResult, ProductSearchBuilder, ProductSearchResponse, SearchCollectionBuilder, SearchTermPredictionBuilder, SearchTermPredictionResponse, SearchTermPredictionResult } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { defaultProductProperties } from '../defaultProductProperties';
import { getRelewiseContextSettings, getRelewiseUIOptions, getRelewiseUISearchOptions } from '../helpers/relewiseUIOptions';
import { getSearcher } from './searcher';
import { theme } from '../theme';
import { RelewiseUISearchOptions } from 'src';

export class SearchResult {
    product?: ProductResult;
    searchTermPrediction?: SearchTermPredictionResult;
}

export class ProductSearchOverlay extends LitElement {
    
    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string = undefined;

    @property({ type: Number, attribute: 'number-of-products' })
    numberOfProducts: number = 5;

    @property({ type: Number, attribute: 'number-of-search-term-predictions' })
    numberOfSearchTermPredictions: number = 3;

    @property({ type: Number, attribute: 'debounce-time' })
    debounceTime: number = 250;

    @state()
    results: SearchResult[] | null = null;

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
    searchOptions: RelewiseUISearchOptions | undefined = getRelewiseUISearchOptions();

    private debounceTimeoutHandlerId: ReturnType<typeof setTimeout> | null = null;
    
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
        }, this.debounceTime);
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

    handleActionOnResult(result: SearchResult) {
        if (result.searchTermPrediction) {
            this.setSearchTerm(result.searchTermPrediction.term ?? '');
        }

        if (result.product && result.product.data && 'Url' in result.product.data) {
            window.location.href = result.product.data['Url'].value ?? '';
        }
    }

    async search(searchTerm: string) {
        const relewiseUIOptions = getRelewiseUIOptions();
        const settings = getRelewiseContextSettings(this.displayedAtLocation ? this.displayedAtLocation : 'Relewise Product Search Overlay');
        const searcher = getSearcher(relewiseUIOptions);
        const requestBuilder = new SearchCollectionBuilder()
            .addRequest(new ProductSearchBuilder(settings)
                .setSelectedProductProperties(relewiseUIOptions.selectedPropertiesSettings?.product ?? defaultProductProperties)
                .setTerm(searchTerm)
                .pagination(p => p.setPageSize(this.numberOfProducts))
                .filters(builder => {
                    if (relewiseUIOptions.filters?.product) {
                        relewiseUIOptions.filters.product(builder);
                    }
                    if (this.searchOptions && this.searchOptions.filters?.productSearch) {
                        this.searchOptions.filters.productSearch(builder);
                    }
                })
                .build());

        if (this.numberOfSearchTermPredictions > 0) {
            requestBuilder.addRequest(new SearchTermPredictionBuilder(settings)
                .setTerm(searchTerm)
                .take(this.numberOfSearchTermPredictions)
                .addEntityType('Product')
                .build());
        }
            

        const response = await searcher.batch(requestBuilder.build());
        if (response && response.responses) {
            const productSearchResult = response.responses[0] as ProductSearchResponse;
            const products = productSearchResult.results?.map(result => {
                const searchResult = new SearchResult();
                searchResult.product = result;
                return searchResult;
            }) ?? [];

            const searchTermPredictionResult = response.responses[1] as SearchTermPredictionResponse;
            const searchTermPredictions = searchTermPredictionResult.predictions?.map(result => {
                const searchResult = new SearchResult();
                searchResult.searchTermPrediction = result;
                return searchResult;
            }) ?? [];

            this.results = searchTermPredictions.concat(products);
            this.hasCompletedSearchRequest = true;
        }
    }

    render() {
        return html`
            <relewise-search-bar 
                .term=${this.term}
                .setSearchTerm=${(term: string)=> this.setSearchTerm(term)}
                .setSearchBarInFocus=${(inFocus: boolean) => this.searchBarInFocus = inFocus}
                .placeholder=${this.searchOptions?.localization?.searchBar?.placeholder ?? 'Search'}
                .handleKeyEvent=${(e: KeyboardEvent) => this.handleKeyDown(e)}
                ></relewise-search-bar>    
            ${(this.searchBarInFocus &&
                this.hasCompletedSearchRequest &&
                this.term) ||
                this.resultBoxIsHovered ? 
                html`<relewise-product-search-overlay-results
                    .selectedIndex=${this.selectedIndex}
                    .results=${this.results} 
                    .setSearchTerm=${(term: string)=> this.setSearchTerm(term)}
                    .noResultsMessage=${this.searchOptions?.localization?.searchResults?.noResults ?? 'No products found'}
                    .setResultOverlayHovered=${(hovered: boolean) => this.resultBoxIsHovered = hovered }>
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