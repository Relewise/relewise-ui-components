import { RelewiseLitElement } from '../../relewise-lit-element';
import { css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events, QueryKeys, getRelewiseUISearchOptions, readCurrentUrlState, updateUrlState } from '../../helpers';
import { theme } from '../../theme';
import { getSearchSortingOptions, SearchSortingOption } from '../searchSortingBuilder';

export class ProductSearchSorting extends RelewiseLitElement {
    @property({ type: String, attribute: 'target' })
    target: string | null = null;

    @property({ attribute: false })
    applySorting = () => window.dispatchEvent(new CustomEvent(Events.applySorting));

    @property({ attribute: false })
    sortingQueryKey: string = QueryKeys.sortBy;

    @state()
    selectedOption: string | null = null;

    readSortingFromUrlBound = this.readSortingFromUrl.bind(this);

    connectedCallback(): void {
        super.connectedCallback();
        this.selectedOption = readCurrentUrlState(this.sortingQueryKey);
        window.addEventListener(Events.search, this.readSortingFromUrlBound);
    }

    disconnectedCallback() {
        window.removeEventListener(Events.search, this.readSortingFromUrlBound);
        super.disconnectedCallback();
    }

    readSortingFromUrl() {
        this.selectedOption = readCurrentUrlState(this.sortingQueryKey);
    }

    setSelectedValue(event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        this.selectedOption = selectElement.value;
        updateUrlState(this.sortingQueryKey, this.selectedOption);
        this.applySorting();
    }

    getOptionText(option: SearchSortingOption): string {
        const localization = getRelewiseUISearchOptions()?.localization?.sortingButton;
        return option.getLabel(localization);
    }

    getOptions(): SearchSortingOption[] {
        if (this.target) {
            const targetedOptions = window.relewiseUISearchTargetedConfigurations?.getSortingOptions(this.target);
            if (targetedOptions) {
                return targetedOptions;
            }
        }

        return getSearchSortingOptions(getRelewiseUISearchOptions()?.sorting);
    }

    render() {
        const options = this.getOptions();
        if (options.length < 1) {
            return nothing;
        }

        const selectedOptionId = this.selectedOption ?? options[0].id ?? null;
        const localization = getRelewiseUISearchOptions()?.localization?.sortingButton;
        return html`
            <label class="rw-label-wrapper" part="container">
                <span class="rw-label" part="label">${localization?.sortBy ?? 'Sort by:'}</span>
                <select @change=${this.setSelectedValue} class="rw-select rw-border" part="select">
                ${options.map((item) => {
            return html`
                        <option value=${item.id} ?selected=${selectedOptionId === item.id}>
                            <span>${this.getOptionText(item)}</span>
                        </option>
                    `;
        })}
                </select>
            </label>
        `;
    }

    static styles = [theme, css`
        :host {
            min-width: 0;
        }

        .rw-label-wrapper {
            display: inline-flex;
            align-items: center;
            min-width: 0;
        }

        :host(.rw-universal-search-sorting) .rw-label-wrapper {
            position: relative;
        }

        :host(.rw-universal-search-sorting) .rw-label-wrapper::after {
            border-bottom: 0.14em solid currentColor;
            border-right: 0.14em solid currentColor;
            content: '';
            height: 0.45em;
            pointer-events: none;
            position: absolute;
            right: var(--relewise-universal-search-sorting-arrow-inset, 0.8em);
            top: 50%;
            transform: translateY(-70%) rotate(45deg);
            width: 0.45em;
        }

        .rw-select {
            font-family: var(--font);
            max-width: 100%;
            min-width: 0;

            padding: var(--relewise-product-search-sorting-padding, .5em);

            font-weight: var(--relewise-button-text-font-weight, 600);
            border: 1px solid var(--relewise-checklist-facet-border-color, #eee);
            background-color: white;
            color: var(--relewise-button-text-color, #333);
            border-radius: 0.5em;
            box-shadow: 0 1px rgb(0 0 0 / 0.05);
            font-size: 0.8em;   
        }

        :host(.rw-universal-search-sorting) .rw-select {
            appearance: none;
            padding-right: var(--relewise-universal-search-sorting-arrow-space, 2.25em);
        }

        .rw-select option {
            text-align: start;
            text-align-last: start;
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
