import { LitElement, css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { theme } from '../../theme';
import { SearchResult } from '../product-search-overlay';
import { getRelewiseUISearchOptions } from '../../helpers';
import { User } from '@relewise/client';

export class ProductSearchOverlayResults extends LitElement {

    @property()
    setSearchTerm = (term: string) => { };

    @property()
    redirectToSearchPage = () => { };

    @property({ type: Number })
    hits = 0;

    @property()
    noResultsMessage: string | null = null;

    @property({ type: Array })
    results: SearchResult[] | null = null;

    @property({ type: Number })
    selectedIndex = -1;

    @property()
    setResultOverlayHovered = (hovered: boolean) => { };

    @property({ type: Object })
    user: User | null = null;

    connectedCallback(): void {
        super.connectedCallback();
    }

    render() {
        const localization = getRelewiseUISearchOptions()?.localization?.searchResults;

        return html`
            <div class="rw-result-container rw-border" part="overlay"
                @mouseover=${() => this.setResultOverlayHovered(true)}
                @mouseleave=${() => this.setResultOverlayHovered(false)}>
                ${(!this.results ||
                this.results.length === 0) ? html`
                    <div class="rw-no-results">${this.noResultsMessage ?? 'No search results found'}</div>
                ` : html`
                    ${this.results.map((result, index) => {
                    return html`
                        <div ?selected=${index === this.selectedIndex} class="rw-selected-result">
                        ${result.title ?
                            html`
                                <div class="rw-title" part="title">
                                   ${result.title}
                                </div>
                            ` : nothing}
                        ${result.redirect ? html`
                            <div class="rw-item-container" @click=${() => window.location.href = result.redirect?.destination ?? ''}>
                                <span class="rw-item">
                                    ${result.redirect.data?.Title}
                                </span>
                                <relewise-arrow-up-icon class="rw-icon"></relewise-arrow-up-icon>
                            </div>` : nothing}
                        ${result.searchTermPrediction ?
                            html`
                                <div class="rw-item-container" @click=${() => this.setSearchTerm(result.searchTermPrediction!.term ?? '')}>
                                    <span class="rw-item">
                                        ${result.searchTermPrediction.term}
                                    </span>
                                    <relewise-search-icon class="rw-icon"></relewise-search-icon>
                                </div>
                            ` : nothing}
                        ${result.productCategory ?
                            html`
                                <div class="rw-product-item-container">
                                    <relewise-product-search-overlay-product-category .productCategory=${result.productCategory} .user=${this.user}></relewise-product-search-overlay-product-category>
                                </div>
                            ` : nothing}
                        ${result.product ?
                            html`
                                <div class="rw-product-item-container">
                                    <relewise-product-search-overlay-product .product=${result.product} .user=${this.user}></relewise-product-search-overlay-product>
                                </div>
                            ` : nothing}
                       
                        ${result.showAllResults ?
                            html`
                                <div class="rw-item-container" @click=${() => this.redirectToSearchPage()}>
                                    <span class="rw-item">${localization?.showAllResults ?? 'Show all results'} (${this.hits})</span>
                                    <relewise-arrow-up-icon class="rw-icon"></relewise-arrow-up-icon>
                                </div>
                            ` : nothing}
                    </div>`;
                },
                )}`}
            </div>
        `;
    }

    static styles = [
        theme,
        css`
        :host {
            position: absolute;
            z-index: 999;
            left: 0;
            right: 0;
            margin-top: .25em;
        }
        
        .rw-result-container {
            overflow: hidden;
            background-color: var(--relewise-product-search-overlay-background-color, white);
            box-shadow: var(--relewise-product-search-overlay-box-shadow, 0 10px 15px rgb(0 0 0 / 0.2));
            border-color: var(--relewise-product-search-overlay-border-color, #ddd);
        }
        
        .rw-no-results {
            margin: 1em;
            font-weight: var(--relewise-product-search-overlay-no-results-message-font-weight, 300);
            color: var(--relewise-product-search-overlay-no-results-message-color, #212427);
        }

        .rw-item-container {
            cursor: pointer;
            display: flex;
            color: var(--relewise-product-search-result-overlay-prediction-item-color, #212427);
        }

        .rw-products-container {
            display: flex;
            flex-direction: column;
        }

        .rw-item {
            border-radius: 1em;
            margin: .5em 1em .5em 1em;
            font-weight: var(--relewise-product-search-overlay-prediction-item-font-weight, 300);
            flex-grow: 1;
        }

         .rw-title {
            margin: var(--relewise-product-search-overlay-title-padding, 1em 1em 0.2em 1em);
            font-size: var(--relewise-product-search-overlay-title-font-size, 0.9em);
            font-weight: var(--relewise-product-search-overlay-title-font-weight, 500);
            flex-grow: 1;
        }

        .rw-selected-result[selected] {
            background-color: var(--relewise-hover-color, whitesmoke);
        }

        .rw-item-container:hover {
            background-color: var(--relewise-hover-color, whitesmoke);
        }

        .rw-product-item-container:hover {
            background-color: var(--relewise-hover-color, whitesmoke);
        }

        .rw-icon {
            margin: auto;
            padding-right: 1em;
            --relewise-icon-color: var(--accent-color);
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-search-overlay-results': ProductSearchOverlayResults;
    }
}