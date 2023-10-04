import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { theme } from '../../theme';
import { SearchResult } from '../search-overlay';

export class ProductSearchBarResultOverlay extends LitElement {

    @property()
    setSearchTerm = (term: string) => {};

    @property()
    noResultsMessage: string | null = null;

    @property({ type: Array })
    results: SearchResult[] | null = null;

    @property({ type: Number })
    selectedIndex = -1;
    
    connectedCallback(): void {
        super.connectedCallback();
    }

    render() {
        return html`
            <div class="rw-result-container">
                ${(!this.results ||
                this.results.length < 1) ? html`
                    <div class="rw-no-results">${this.noResultsMessage ?? 'No search results to show'}</div>
                ` : html`
                <div>
                    ${this.results.map((result, index) => {
                        return html`
                        <div ?selected=${index === this.selectedIndex} class="rw-selected-result">
                        ${result.searchTermPrediction ?
                            html`
                                <div class="rw-prediction-item-container" @click=${() => this.setSearchTerm(result.searchTermPrediction!.term ?? '')}>
                                    <h3 class="rw-prediction-item">
                                        ${result.searchTermPrediction.term}
                                    </h3>
                                    <relewise-search-icon class="rw-search-icon"></relewise-search-icon>
                                </div>
                            ` : 
                            html`
                                <div class="rw-product-item-container">
                                    <relewise-search-result-overlay-product .product=${result.product ?? null}></relewise-search-result-overlay-product>
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
            background-color: var(--relewise-search-overlay-background-color, white);
            box-shadow: var(--relewise-search-overlay-box-shadow, 0 10px 15px rgb(0 0 0 / 0.2));
            border: var(--relewise-search-overlay-border, 2px solid);
            border-color: var(--accent-color);
            border-radius: var(--relewise-search-overlay-border-radius, 1rem);
        }

        .rw-no-results {
            margin: 1rem;
            color: var(--relewise-search-overlay-no-results-message-color, lightgray);
        }

        .rw-devider {
            margin: 0;
        }

        .rw-prediction-item-container {
            cursor: pointer;
            display: flex;
        }

        .rw-products-container {
            display :flex;
            flex-direction: column;
        }

        .rw-prediction-item {
            margin: 0.25rem;
            border-radius: 1rem;
            margin: 1rem;
            flex-grow: 1;
        }

        .rw-selected-result[selected] {
            background-color: whitesmoke;
        }

        .rw-prediction-item-container:hover {
            background-color: whitesmoke;
        }

        .rw-product-item-container:hover {
            background-color: whitesmoke;
        }

        .rw-search-icon {
            margin: auto;
            padding-right: 1rem;
            --relewise-search-icon-color: var(--accent-color);
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-search-result-overlay': ProductSearchBarResultOverlay;
    }
}