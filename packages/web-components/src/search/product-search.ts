import { ProductSearchBuilder, ProductSearchResponse } from '@relewise/client';
import { LitElement, css, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { defaultProductProperties } from '../defaultProductProperties';
import { Events, categoryFacetQueryName, readCurrentUrlState, readCurrentUrlStateValues, searhTermQueryName, updateUrlState } from '../helpers';
import { getRelewiseContextSettings, getRelewiseUIOptions, getRelewiseUISearchOptions } from '../helpers/relewiseUIOptions';
import { theme } from '../theme';
import { getSearcher } from './searcher';

export class ProductSearch extends LitElement {
    
    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string = undefined;

    @property({ attribute: 'search-bar-placeholder' })
    searchBarPlaceholder: string | null = null;

    @state()
    term: string | null = null;

    @state()
    searchResult: ProductSearchResponse | null = null;

    async connectedCallback() {
        if (!this.displayedAtLocation) {
            console.error('No displayedAtLocation defined!');
        }

        this.term = readCurrentUrlState(searhTermQueryName) ?? null;
        this.search();
        window.addEventListener(Events.shouldPerformSearch, () => this.search());
        super.connectedCallback();
    }

    handleKeyDown(event: KeyboardEvent): void {
        switch (event.key) {
        case 'Enter':
            event.preventDefault();
            this.search();
            break;
        }
    }

    async search() {
        updateUrlState(searhTermQueryName, this.term ?? '');

        const relewiseUIOptions = getRelewiseUIOptions();
        const searchOptions = getRelewiseUISearchOptions();
        const settings = getRelewiseContextSettings(this.displayedAtLocation ? this.displayedAtLocation : 'Relewise Product Search Overlay');
        const searcher = getSearcher(relewiseUIOptions);

        const requestBuilder = new ProductSearchBuilder(settings)
            .setSelectedProductProperties(relewiseUIOptions.selectedPropertiesSettings?.product ?? defaultProductProperties)
            .setTerm(this.term  ? this.term : null)
            .filters(builder => {
                if (relewiseUIOptions.filters?.product) {
                    relewiseUIOptions.filters.product(builder);
                }
                if (searchOptions && searchOptions.filters?.productSearch) {
                    searchOptions.filters.productSearch(builder);
                }
            })
            .facets(builder => {
                if (searchOptions && searchOptions.facets && searchOptions.facets.categoryFacet) {
                    searchOptions.facets.categoryFacet(builder, readCurrentUrlStateValues(categoryFacetQueryName));
                }
            });

        const response = await searcher.searchProducts(requestBuilder.build());
        if (!response) {
            return;
        } 

        this.searchResult = response;
        this.setSearchResultOnSlotChilderen(response);
    }
    
    setSearchResultOnSlotChilderen(searchResult: ProductSearchResponse) {
        const slot = this.renderRoot.querySelector('slot');
        if (slot) {
            const assignedNodes = slot.assignedNodes();

            assignedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE && node instanceof HTMLElement) {
                    const element = node as HTMLElement;
                    if (element.tagName && element.tagName.toLowerCase().startsWith('relewise-')) {
                        element.setAttribute('search-result', JSON.stringify(searchResult));
                    }
                }
            });
        }
    }

    render() {
        console.log(this.searchResult);
        return html`
        <div class="rw-search-bar-container">
            <relewise-search-bar 
                .term=${this.term ?? ''}
                .setSearchTerm=${(term: string)=> this.term = term}
                .placeholder=${this.searchBarPlaceholder}
                .handleKeyEvent=${(e: KeyboardEvent) => this.handleKeyDown(e)}
                class="rw-search-bar">
            </relewise-search-bar>
            <relewise-button 
                button-text="Search"
                .handleClick=${() => this.search()}>
                <relewise-search-icon name="icon"></relewise-search-icon>
            </relewise-button>
        </div>
        <slot>
        <div class="rw-grid">
                <div class="rw-facet-container">
                    <relewise-category-facet
                        .searchResult=${this.searchResult}>
                    </relewise-category-facet>
                </div>
                <relewise-product-search-results
                    .searchResult=${this.searchResult}>
                </relewise-product-search-results>
            </div>
        </slot>
        `;
    }

    static styles = [theme, css`
        :host {
            font-family: var(--font);
        }

        .rw-search-bar-container {
            display: flex;
            margin-top: 1rem;
            margin-bottom: 1rem;
        }
        
        .rw-search-bar {
            width: 100%;
            margin-right: .5rem;
            --color: var(--accent-color);
        }

        .rw-grid {
            display: grid;
            grid-template-columns: 1fr 3fr;
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-search': ProductSearch;
    }
}