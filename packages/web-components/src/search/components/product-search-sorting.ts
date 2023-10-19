import { LitElement, css, html, nothing } from 'lit';
import { theme } from '../../theme';
import { property, state } from 'lit/decorators.js';

export class ProductSearchSorting extends LitElement {

    @property({ type: Boolean }) 
    showSortingOptions: boolean = false;

    @state()
    selectedOption: string | null = null;

    sortingOptions: string[] = [
        'SalesPriceAsc',
        'SalesPriceDecs',
        'AlphabeticallyAsc',
        'AlphabeticallyDecs',
        'Recommended',
    ];

    connectedCallback(): void {
        super.connectedCallback();
    }

    render() {
        console.log('rerendering');
        return html`
            <select value="Sorting">
                ${this.sortingOptions.map((item) => {
                    return html`
                        <option>${item}</option>
                    `;
                })}
            </select>
            <relewise-button
                class="rw-button"
                @click=${() => this.showSortingOptions = !this.showSortingOptions}
                button-text=${this.selectedOption ?? 'Sorting'}>
                    ${this.showSortingOptions || this.selectedOption ? html`
                        <relewise-x-icon class="rw-icon" @click=${() => {
                            this.selectedOption = null;
                            this.showSortingOptions = false;
                        }
                    }></relewise-x-icon>
                    ` : html`
                        <relewise-sort-icon class="rw-icon"></relewise-sort-icon>
                    `}
            </relewise-button>
            ${this.showSortingOptions ? html`
            <div class="rw-sorting-options">
                ${this.sortingOptions.map((item) => {
                    return html`
                    <div class="rw-sorting-option">
                        <relewise-button 
                            class="rw-sorting-option-button"
                            button-text=${item}
                            @click=${() => {
                                this.selectedOption = item;
                                this.showSortingOptions = false;
                            }}></relewise-button>
                    </div>
                    `;
                })}
            </div>
            ` : nothing}
        `;
    }

    static styles = [theme, css`
        .rw-icon {
            --relewise-icon-width: 1.25rem;
            --relewise-icon-height: 1.25rem;
        }

        .rw-sorting-options {
            position: absolute;
            z-index: 10;
            background-color: white;
            border: 2px solid;
            border-radius: 1rem;
            border-color: var(--accent-color);
            overflow: hidden;
            margin-top: .25rem;
        }
        
        .rw-sorting-option {
            --relewise-button-text-color: black;
        }
        
        .rw-sorting-option-button {
            margin: 0;
        }

        .rw-sorting-option:hover {
            background-color: whitesmoke;
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-search-sorting': ProductSearchSorting;
    }
}