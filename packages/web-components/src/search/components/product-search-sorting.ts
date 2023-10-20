import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { theme } from '../../theme';
import { productSearchSorting, updateUrlState } from '../../helpers';

export class ProductSearchSorting extends LitElement {
    // Properties and initial values
    @property({ type: Boolean })
    showSortingOptions: boolean = false;

    @state()
    selectedOption: string | null = null;

    sortingOptions: string[] = [
        'SalesPriceAsc',
        'SalesPriceDesc',
        'AlphabeticallyAsc',
        'AlphabeticallyDesc',
        'Recommended',
    ];

    connectedCallback(): void {
        super.connectedCallback();
    }

    handleKeyDown(event: KeyboardEvent): void {
        switch (event.key) {
        case 'Escape':
            event.preventDefault();
            this.showSortingOptions = false;
            break;
        }
    }

    handleBlur(event: FocusEvent): void {
        const relatedTarget = event.relatedTarget as HTMLElement | null;

        if (relatedTarget && relatedTarget.getAttribute('name') === 'relewise-sorting-option-button') {
            return;
        }

        this.showSortingOptions = false;
    }

    clearSelectedValue(e: Event) {
        this.selectedOption = null;
        updateUrlState(productSearchSorting, '');
        e.stopPropagation();
    }

    setSelectedValue(item: string) {
        this.selectedOption = item;
        this.showSortingOptions = false;
        updateUrlState(productSearchSorting, item);
    }

    render() {
        return html`
            <relewise-button
                class="rw-button"
                @keydown=${this.handleKeyDown}
                @click=${() => this.showSortingOptions = !this.showSortingOptions}
                @blur=${this.handleBlur}
                button-text=${this.selectedOption ?? 'Sorting'}>
                ${this.showSortingOptions || this.selectedOption ? html`
                    <relewise-x-icon class="rw-icon" @click=${this.clearSelectedValue}></relewise-x-icon>
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
                                    name="relewise-sorting-option-button"
                                    class="rw-sorting-option-button"
                                    button-text=${item}
                                    @click=${() => this.setSelectedValue(item)}
                                ></relewise-button>
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
