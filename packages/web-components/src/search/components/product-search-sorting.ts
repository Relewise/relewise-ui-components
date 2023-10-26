import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { theme } from '../../theme';
import { Events, productSearchSorting, readCurrentUrlState, updateUrlState } from '../../helpers';
import { SortingEnum } from '../enums';

export class ProductSearchSorting extends LitElement {
    @property({ type: Boolean })
    showSortingOptions: boolean = false;

    @state()
    selectedOption: string | null = null;

    @property({ attribute: 'sales-price-ascending-text'})
    salesPriceAscendingText: string | null  = null;

    @property({ attribute: 'sales-price-decending-text'})
    salesPriceDescendingText: string | null  = null;

    @property({ attribute: 'alphabetically-ascending-text'})
    alphabeticallyAscendingText: string | null  = null;

    @property({ attribute: 'alphabetically-decending-text'})
    alphabeticallyDescendingText: string | null  = null;
    
    @property({ attribute: 'populartity-text'})
    popularityText: string | null  = null;

    connectedCallback(): void {
        super.connectedCallback();
        this.selectedOption = readCurrentUrlState(productSearchSorting);
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
        window.dispatchEvent(new CustomEvent(Events.search));
        e.stopPropagation();
    }

    setSelectedValue(item: string) {
        this.selectedOption = item;
        this.showSortingOptions = false;
        updateUrlState(productSearchSorting, item);
        window.dispatchEvent(new CustomEvent(Events.search));
    }

    getOptionText(sortingValue: string): string {

        const sortingEnum = SortingEnum[sortingValue as keyof typeof SortingEnum];

        switch (sortingEnum) {
        case SortingEnum.SalesPriceAsc:
            return this.salesPriceAscendingText ?? 'Price: low - high';
        case SortingEnum.SalesPriceDesc:
            return this.salesPriceDescendingText ?? 'Price: high - low';
        case SortingEnum.AlphabeticallyAsc:
            return this.alphabeticallyAscendingText ?? 'Name: a - z';
        case SortingEnum.AlphabeticallyDesc:
            return this.alphabeticallyDescendingText ?? 'Name: z - a';
        case SortingEnum.Popularity:
            return this.popularityText ?? 'Popularity';
        default:
            return '';
        }
    }

    render() {
        return html`
            <relewise-button
                class="rw-button"
                @keydown=${this.handleKeyDown}
                @click=${() => this.showSortingOptions = !this.showSortingOptions}
                @blur=${this.handleBlur}
                button-text=${this.selectedOption ? this.getOptionText(this.selectedOption) : 'Sorting'}>
                ${this.showSortingOptions || this.selectedOption ? html`
                    <relewise-x-icon @click=${this.clearSelectedValue}></relewise-x-icon>
                ` : html`
                    <relewise-sort-icon></relewise-sort-icon>
                `}
            </relewise-button>
            ${this.showSortingOptions ? html`
                <div class="rw-sorting-options">
                    ${Object.keys(SortingEnum).map((item) => {
                        return html`
                            <div class="rw-sorting-option">
                                <relewise-button
                                    name="relewise-sorting-option-button"
                                    class="rw-sorting-option-button"
                                    button-text=${this.getOptionText(item)}
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
        .rw-sorting-options {
            position: absolute;
            z-index: 10;
            background-color: white;
            border: 2px solid;
            border-radius: 1rem;
            border-color: var(--accent-color);
            overflow: hidden;
            margin-top: .25rem;
            right: var(--relewise-sorting-options-right, auto);
            left: var(--relewise-sorting-options-left, auto);
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
