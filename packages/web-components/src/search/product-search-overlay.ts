import { ProductCategoryResult, ProductCategorySearchResponse, ProductResult, ProductSearchResponse, RedirectResult, SearchCollectionBuilder, SearchTermPredictionBuilder, SearchTermPredictionResponse, SearchTermPredictionResult, User } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { getRelewiseContextSettings, getRelewiseUIOptions, getRelewiseUISearchOptions } from '../helpers/relewiseUIOptions';
import { getSearcher } from './searcher';
import { theme } from '../theme';
import { createProductSearchBuilder, createProductCategorySearchBuilder } from '../builders';

export type SearchResult = {
    title?: string;
    product?: ProductResult;
    searchTermPrediction?: SearchTermPredictionResult;
    productCategory?: ProductCategoryResult;
    redirect?: RedirectResult;
    showAllResults?: boolean;
}

export class ProductSearchOverlay extends LitElement {

    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string = undefined;

    @property({ type: Number, attribute: 'number-of-products' })
    numberOfProducts: number = 5;

    @property({ type: Number, attribute: 'number-of-search-term-predictions' })
    numberOfSearchTermPredictions: number = 3;

    @property({ type: Number, attribute: 'number-of-search-product-categories' })
    numberOfProductCategories: number = 3;

    @property({ attribute: 'search-page-url' })
    searchPageUrl?: string = undefined;

    @property({ type: Boolean, reflect: true })
    autofocus = false;

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

    @state()
    user: User | null = null;

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

        let newIndex = 0;
        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                newIndex = Math.max(this.selectedIndex - 1, 0);
                if (this.results[newIndex]?.title) newIndex = Math.max(newIndex - 1, 0);
                this.selectedIndex = newIndex;
                break;
            case 'ArrowDown':
                event.preventDefault();
                newIndex = Math.min(this.selectedIndex + 1, this.results.length - 1);
                if (this.results[newIndex]?.title) newIndex = Math.min(newIndex + 1, this.results.length - 1);
                this.selectedIndex = newIndex;
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
        } else if (result?.productCategory) {
            const selectedCategory = this.shadowRoot!
                .querySelector('relewise-product-search-overlay-results')
                ?.shadowRoot
                ?.querySelector('.rw-selected-result[selected]');

            if (selectedCategory) {
                const categoryLink = selectedCategory
                    .querySelector('relewise-product-search-overlay-product-category')
                    ?.shadowRoot
                    ?.querySelector('a')
                    ?.getAttribute('href');

                if (categoryLink) {
                    window.location.href = categoryLink;
                }
            }
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
            // We have previously validated the destination as a valid URL.
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
        const settings = await getRelewiseContextSettings(this.displayedAtLocation ? this.displayedAtLocation : 'Relewise Product Search Overlay');
        const searcher = getSearcher(relewiseUIOptions);
        this.user = settings.user;

        const requestBuilder = new SearchCollectionBuilder()
            .addRequest(createProductSearchBuilder(this.term, settings)
                .pagination(p => p.setPageSize(this.numberOfProducts))
                .build());

        if (this.numberOfSearchTermPredictions > 0) {
            requestBuilder.addRequest(new SearchTermPredictionBuilder(settings)
                .setTerm(searchTerm)
                .take(this.numberOfSearchTermPredictions)
                .addEntityType('Product')
                .build());
        }

        if (this.numberOfProductCategories > 0) {
            requestBuilder.addRequest(createProductCategorySearchBuilder(this.term, settings)
                .pagination(p => p.setPageSize(this.numberOfProductCategories))
                .build());
        }

        this.abortController = new AbortController();
        const response = await searcher.batch(requestBuilder.build(), { abortSignal: this.abortController.signal });
        if (response && response.responses) {
            const productSearchResult = response.responses[0] as ProductSearchResponse;
            this.productSearchResultHits = productSearchResult.hits;
            const products: SearchResult[] = productSearchResult.results?.map(product => {
                return { product };
            }) ?? [];
            this.redirects = productSearchResult.redirects;
            const redirects: SearchResult[] = productSearchResult.redirects?.filter(x => x.data?.Title && URL.canParse(x.destination ?? '')).map(x => ({ redirect: x })) ?? [];

            let searchTermPredictions: SearchResult[] = [];
            const searchTermPredictionResponse = findResponseOfType<SearchTermPredictionResponse>(response.responses, 'SearchTermPredictionResponse');
            if (searchTermPredictionResponse) {
                searchTermPredictions = searchTermPredictionResponse.predictions?.map(searchTermPrediction => {
                    return { searchTermPrediction };
                }) ?? [];
            }

            const localization = getRelewiseUISearchOptions()?.localization;
            let productCategories: SearchResult[] = [];
            const productCategoriesResponse = findResponseOfType<ProductCategorySearchResponse>(response.responses, 'ProductCategorySearchResponse');
            if (productCategoriesResponse) {
                productCategories = productCategoriesResponse.results?.map(productCategory => {
                    return { productCategory };
                }) ?? [];
                if (productCategories.length > 0)
                    productCategories = [{ title: localization?.searchBar?.overlay?.title?.productCategories ?? 'Categories' }, ...productCategories];
            }

            if (products.length > 0 && this.numberOfProductCategories > 0)
                products.unshift({ title: localization?.searchBar?.overlay?.title?.products ?? 'Products' })

            this.results = redirects.concat(searchTermPredictions).concat(products).concat(productCategories);

            if (this.searchPageUrl && productSearchResult.hits > 0)
                this.results.push({ showAllResults: true });

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
                .setSearchBarInFocus=${(inFocus: boolean) => this.searchBarInFocus = inFocus}
                .placeholder=${localization?.searchBar?.placeholder ?? 'Search'}
                .handleKeyEvent=${(e: KeyboardEvent) => this.handleKeyDown(e)}
                .autofocus="${this.autofocus}"
                ></relewise-search-bar>    
            ${(this.searchBarInFocus &&
                this.hasCompletedSearchRequest &&
                this.term) ||
                this.resultBoxIsHovered ?
                html`<relewise-product-search-overlay-results
                    part="overlay"
                    exportparts="overlay: overlay-container, title: overlay-title"
                    .selectedIndex=${this.selectedIndex}
                    .results=${this.results} 
                    .setSearchTerm=${(term: string) => this.setSearchTerm(term)}
                    .redirectToSearchPage=${() => this.redirectToSearchPage()}
                    .noResultsMessage=${localization?.searchResults?.noResults ?? 'No products found'}
                    .setResultOverlayHovered=${(hovered: boolean) => this.resultBoxIsHovered = hovered}
                    .hits=${this.productSearchResultHits}
                    .user=${this.user}>
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

// Runtime-safe helpers for identifying response types coming from the server.
// The generated client types sometimes don't include the runtime "$type" (or "@type")
// property, but the server still sends it. These helpers centralize the checks and
// make the search calls easier to read and safer.
function isResponseWithType(response: any, typeName: string): boolean {
    if (!response || typeof response !== 'object') return false;
    const maybeType = response.$type ?? response['@type'] ?? response.type;
    return typeof maybeType === 'string' && maybeType.includes(typeName);
}

function findResponseOfType<T>(responses: any[] | undefined, typeName: string): T | undefined {
    if (!responses) return undefined;
    return responses.find(r => isResponseWithType(r, typeName)) as T | undefined;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-search-overlay': ProductSearchOverlay;
    }
}