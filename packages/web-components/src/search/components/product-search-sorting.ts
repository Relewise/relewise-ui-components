import { LitElement, css, html } from 'lit';
import { state } from 'lit/decorators.js';
import { Events, QueryKeys, getRelewiseUISearchOptions, readCurrentUrlState, updateUrlState } from '../../helpers';
import { theme } from '../../theme';
import { SortingEnum } from '../enums';

export class ProductSearchSorting extends LitElement {
    @state()
    selectedOption: string = SortingEnum.Relevance;

    readSortingFromUrlBound = this.readSortingFromUrl.bind(this);

    connectedCallback(): void {
        super.connectedCallback();
        this.selectedOption = readCurrentUrlState(QueryKeys.sortBy) ?? SortingEnum.Relevance;
        window.addEventListener(Events.search, this.readSortingFromUrlBound);
    }

    disconnectedCallback() {
        window.removeEventListener(Events.search, this.readSortingFromUrlBound);
        super.disconnectedCallback();
    }

    readSortingFromUrl() {
        this.selectedOption = readCurrentUrlState(QueryKeys.sortBy) ?? SortingEnum.Relevance;
    }

    setSelectedValue(event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        this.selectedOption = selectElement.value;
        updateUrlState(QueryKeys.sortBy, this.selectedOption);
        window.dispatchEvent(new CustomEvent(Events.applySorting));
    }

    getOptionText(sortingValue: string): string {

        const sortingEnum = SortingEnum[sortingValue as keyof typeof SortingEnum];
        const localization = getRelewiseUISearchOptions()?.localization?.sortingButton;

        switch (sortingEnum) {
            case SortingEnum.SalesPriceAsc:
                return localization?.salesPriceAscending ?? 'Price: low - high';
            case SortingEnum.SalesPriceDesc:
                return localization?.salesPriceDescending ?? 'Price: high - low';
            case SortingEnum.AlphabeticallyAsc:
                return localization?.alphabeticalAscending ?? 'Name: a - z';
            case SortingEnum.AlphabeticallyDesc:
                return localization?.alphabeticalDescending ?? 'Name: z - a';
            case SortingEnum.Relevance:
                return localization?.relevance ?? 'Relevance';
            default:
                return '';
        }
    }

    render() {
        const localization = getRelewiseUISearchOptions()?.localization?.sortingButton;
        return html`
           <span class="rw-label" part="label">${localization?.sortBy ?? 'Sort by:'}</span> <select @change=${this.setSelectedValue} class="rw-select rw-border" part="select">
                ${Object.keys(SortingEnum).map((item) => {
            return html`
                        <option value=${item} ?selected=${this.selectedOption === item}>
                            <span>${this.getOptionText(item)}</span>
                        </option>
                    `;
        })}
            </select>
        `;
    }

    static styles = [theme, css`
        .rw-select {
            font-family: var(--font);
           
            padding: var(--relewise-product-search-sorting-padding, .5em);

            font-weight: var(--relewise-button-text-font-weight, 600);
            border: 1px solid var(--relewise-checklist-facet-border-color, #eee);
            background-color: white;
            color: var(--relewise-button-text-color, #333);
            border-radius: 0.5em;
            box-shadow: 0 1px rgb(0 0 0 / 0.05);
            font-size: 0.8em;   
        }

        .rw-label {
            font-size: 0.9em;
            color: var(--relewise-button-text-color, #333);
            margin-right: 0.2em;
        }
        
        select:focus {
            outline: none;
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-search-sorting': ProductSearchSorting;
    }
}
