import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events, getRelewiseUISearchOptions, QueryKeys, readCurrentUrlState, updateUrlState } from '../../helpers';
import { theme } from '../../theme';
import { SortingEnum } from '../enums';

export class ProductSearchSorting extends LitElement {
    @property({ type: Boolean })
    showSortingOptions: boolean = false;

    @state()
    selectedOption: string | null = null;

    connectedCallback(): void {
        super.connectedCallback();
        this.selectedOption = readCurrentUrlState(QueryKeys.sortBy);
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
        updateUrlState(QueryKeys.sortBy, null);
        window.dispatchEvent(new CustomEvent(Events.search));
        e.stopPropagation();
    }

    setSelectedValue(item: string) {
        this.selectedOption = item;
        this.showSortingOptions = false;
        updateUrlState(QueryKeys.sortBy, item);
        window.dispatchEvent(new CustomEvent(Events.search));
    }

    getOptionText(sortingValue: string): string {

        const sortingEnum = SortingEnum[sortingValue as keyof typeof SortingEnum];
        const localization = getRelewiseUISearchOptions()?.localization?.sortingButton;

        switch (sortingEnum) {
        case SortingEnum.SalesPriceAsc:
            return localization?.salesPriceAscendingOption ?? 'Price: low - high';
        case SortingEnum.SalesPriceDesc:
            return localization?.salesPriceDescendingOption ?? 'Price: high - low';
        case SortingEnum.AlphabeticallyAsc:
            return localization?.alphabeticalAscendingOption ?? 'Name: a - z';
        case SortingEnum.AlphabeticallyDesc:
            return localization?.alphabeticalDescendingOption ?? 'Name: z - a';
        case SortingEnum.Popularity:
            return localization?.popularityOption ?? 'Popularity';
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
                <div class="rw-sorting-options rw-border">
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
            position: var(--relewise-sorting-options-postion, absolute);
            z-index: var(--relewise-sorting-options-z-index, 10);
            background-color: var(--relewise-sorting-options-background-color, white);
            overflow: hidden;
            margin-top: var(--relewise-sorting-options-margin-top, .25rem);
            right: var(--relewise-sorting-options-right, auto);
            left: var(--relewise-sorting-options-left, auto);
        }
        
        .rw-sorting-option {
            --relewise-button-text-color: var(--relewise-sorting-option-text-color, black);
        }
        
        .rw-sorting-option-button {
            margin: var(--relewise-sorting-sorting-option-margin, 0);
        }

        .rw-sorting-option:hover {
            background-color: var(--relewise-hover-color, whitesmoke);
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-search-sorting': ProductSearchSorting;
    }
}
