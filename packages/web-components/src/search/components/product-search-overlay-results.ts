import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { theme } from '../../theme';
import { SearchResult } from '../product-search-overlay';

export class ProductSearchOverlayResults extends LitElement {

    @property()
    setSearchTerm = (term: string) => {};

    @property()
    noResultsMessage: string | null = null;

    @property({ type: Array })
    results: SearchResult[] | null = null;

    @property({ type: Number })
    selectedIndex = -1;
    
    @property()
    setResultOverlayHovered = (hovered: boolean) => {};

    connectedCallback(): void {
        super.connectedCallback();
    }

    render() {
        return html`
            <div class="rw-result-container"
                @mouseover=${() => this.setResultOverlayHovered(true)}
                @mouseleave=${() => this.setResultOverlayHovered(false)}>
                ${(!this.results ||
                this.results.length < 1) ? html`
                    <div class="rw-no-results">${this.noResultsMessage ?? 'No search results found'}</div>
                ` : html`
                <div>
                    ${this.results.map((result, index) => {
                        return html`
                        <div ?selected=${index === this.selectedIndex} class="rw-selected-result">
                        ${result.searchTermPrediction ?
                            html`
                                <div class="rw-prediction-item-container" @click=${() => this.setSearchTerm(result.searchTermPrediction!.term ?? '')}>
                                    <span class="rw-prediction-item">
                                        ${result.searchTermPrediction.term}
                                    </span>
                                    <relewise-search-icon class="rw-search-icon"></relewise-search-icon>
                                </div>
                            ` : 
                            html`
                                <div class="rw-product-item-container">
                                    <relewise-product-search-overlay-product .product=${result.product}></relewise-product-search-overlay-product>
                                </div>
                            `}
                        </div>`;
                    },
                    )}
                </div>`}
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
            margin-top: .25rem;
        }
        
        .rw-result-container {
            overflow: hidden;
            background-color: var(--relewise-product-search-overlay-background-color, white);
            box-shadow: var(--relewise-product-search-overlay-box-shadow, 0 10px 15px rgb(0 0 0 / 0.2));
            border: var(--relewise-product-search-overlay-border, 2px solid);
            border-color: var(--accent-color);
            border-radius: var(--relewise-product-search-overlay-border-radius, 1rem);
        }
        
        .rw-no-results {
            margin: 1rem;
            font-weight: var(--relewise-product-search-overlay-no-results-message-font-weight, 600);
            color: var(--relewise-product-search-overlay-no-results-message-color, #212427);
        }

        .rw-prediction-item-container {
            cursor: pointer;
            display: flex;
            color: var(--relewise-product-search-result-overlay-prediction-item-color, #212427);
        }

        .rw-products-container {
            display :flex;
            flex-direction: column;
        }

        .rw-prediction-item {
            border-radius: 1rem;
            margin: .5rem 1rem .5rem 1rem;
            font-weight: var(--relewise-product-search-overlay-prediction-item-font-weight, 600);
            flex-grow: 1;
        }

        .rw-selected-result[selected] {
            background-color: whitesmoke;
        }

        .rw-prediction-item-container:hover {
            background-color: var(--relewise-hover-color, whitesmoke);
        }

        .rw-product-item-container:hover {
            background-color: var(--relewise-hover-color, whitesmoke);
        }

        .rw-search-icon {
            margin: auto;
            padding-right: 1rem;
            --relewise-icon-color: var(--accent-color);
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-search-overlay-results': ProductSearchOverlayResults;
    }
}