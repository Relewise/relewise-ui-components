import { LitElement, css, html, nothing } from 'lit';
import { state } from 'lit/decorators.js';
import { Events, QueryKeys, getRelewiseUISearchOptions, readCurrentUrlState, updateUrlState } from '../../helpers';
import { theme } from '../../theme';
import { getSearchSortingOptions, getSearchSortingSelection, SearchSortingOption } from '../searchSortingBuilder';

export class ProductSearchSorting extends LitElement {
    @state()
    selectedOption: string | null = null;

    readSortingFromUrlBound = this.readSortingFromUrl.bind(this);

    connectedCallback(): void {
        super.connectedCallback();
        this.selectedOption = this.getSelectedOptionId();
        window.addEventListener(Events.search, this.readSortingFromUrlBound);
    }

    disconnectedCallback() {
        window.removeEventListener(Events.search, this.readSortingFromUrlBound);
        super.disconnectedCallback();
    }

    readSortingFromUrl() {
        this.selectedOption = this.getSelectedOptionId();
    }

    setSelectedValue(event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        this.selectedOption = selectElement.value;
        updateUrlState(QueryKeys.sortBy, this.selectedOption);
        window.dispatchEvent(new CustomEvent(Events.applySorting));
    }

    getSelectedOptionId(): string | null {
        return getSearchSortingSelection(
            readCurrentUrlState(QueryKeys.sortBy),
            getRelewiseUISearchOptions()?.sorting,
        )?.id ?? null;
    }

    getOptionText(option: SearchSortingOption): string {
        const localization = getRelewiseUISearchOptions()?.localization?.sortingButton;
        return option.getLabel(localization);
    }

    render() {
        const options = getSearchSortingOptions(getRelewiseUISearchOptions()?.sorting);
        if (options.length < 1) {
            return nothing;
        }

        const localization = getRelewiseUISearchOptions()?.localization?.sortingButton;
        return html`
            <label class="rw-label-wrapper">
                <span class="rw-label" part="label">${localization?.sortBy ?? 'Sort by:'}</span>
                <select @change=${this.setSelectedValue} class="rw-select rw-border" part="select">
                ${options.map((item) => {
            return html`
                        <option value=${item.id} ?selected=${this.selectedOption === item.id}>
                            <span>${this.getOptionText(item)}</span>
                        </option>
                    `;
        })}
                </select>
            </label>
        `;
    }

    static styles = [theme, css`
        .rw-label-wrapper {
            display: inline-flex;
            align-items: center;
        }

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
