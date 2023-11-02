import { BooleanAvailableFacetValue, BrandFacetResult, BrandNameAndIdResultAvailableFacetValue, CategoryFacetResult, DecimalNullableChainableRangeAvailableFacetValue, Int32AvailableFacetValue, PriceRangesFacetResult, ProductAssortmentFacetResult, ProductDataBooleanValueFacetResult, ProductDataDoubleRangesFacetResult, ProductDataDoubleValueFacetResult, ProductDataStringValueFacetResult, StringAvailableFacetValue } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events, QueryKeys, getRelewiseUISearchOptions, readCurrentUrlStateValues, updateUrlStateValues } from '../../../helpers';
import { theme } from '../../../theme';

export abstract class ChecklistFacetBase extends LitElement {

    abstract handleChange(e: Event, item: BrandNameAndIdResultAvailableFacetValue | StringAvailableFacetValue | BooleanAvailableFacetValue | Int32AvailableFacetValue | DecimalNullableChainableRangeAvailableFacetValue): void;
    
    abstract getOptionDisplayValue(item: BrandNameAndIdResultAvailableFacetValue | StringAvailableFacetValue | BooleanAvailableFacetValue | Int32AvailableFacetValue | DecimalNullableChainableRangeAvailableFacetValue): string;

    abstract shouldOptionBeChecked(item: BrandNameAndIdResultAvailableFacetValue | StringAvailableFacetValue | BooleanAvailableFacetValue | Int32AvailableFacetValue | DecimalNullableChainableRangeAvailableFacetValue): boolean;

    @property({ type: Object })
    result: (BrandFacetResult | CategoryFacetResult | ProductDataStringValueFacetResult | ProductDataBooleanValueFacetResult | ProductAssortmentFacetResult | PriceRangesFacetResult | ProductDataDoubleRangesFacetResult | ProductDataDoubleValueFacetResult) | null = null;

    @property()
    label: string = '';

    @state()
    selectedValues: string[] = [];

    @state()
    showAll: boolean = false;

    connectedCallback(): void {
        super.connectedCallback();
        if (this.result) {
            if ('key' in this.result)  {
                this.selectedValues = readCurrentUrlStateValues(QueryKeys.facet + this.result.field + this.result.key);
            } else {
                this.selectedValues = readCurrentUrlStateValues(QueryKeys.facet + this.result.field);
            }
        }
    }

    updateUrlState() {
        if (!this.result) {
            return;
        }  

        if ('key' in this.result) {
            updateUrlStateValues(QueryKeys.facet + this.result.field + this.result.key, this.selectedValues);
        } else {
            updateUrlStateValues(QueryKeys.facet + this.result.field, this.selectedValues);
        }

        window.dispatchEvent(new CustomEvent(Events.search));
    }

    render() {
        if (!this.result || !this.result.available || this.result?.available.length < 1) {
            return;
        }

        const localization = getRelewiseUISearchOptions()?.localization?.facets;

        const facetResultsToShow = this.showAll
            ? this.result.available
            : this.result.available.sort((a, b) => {
                if (a.selected && !b.selected) {
                    return -1; // a comes before b
                } else if (!a.selected && b.selected) {
                    return 1; // b comes before a
                } else {
                    return 0; // leave their order unchanged
                }
            }).slice(0, 10);

        return html`
        <div class="rw-facet-content">
            <h3>${this.label}</h3>
            ${facetResultsToShow.map((item, index) => {
                    return html`
                    ${item.value !== undefined ? html`
                        <div>
                            <label class="rw-label" for=${`${this.result?.field}-${this.result?.$type}-${index}`}>
                                <input
                                    type="checkbox"
                                    id=${`${this.result?.field}-${this.result?.$type}-${index}`}
                                    name=${index}
                                    .checked=${this.shouldOptionBeChecked(item)}
                                    @change=${(e: Event) => {
                                        this.handleChange(e, item);
                                        const checkbox = e.target as HTMLInputElement;
                                        checkbox.checked = false;
                                    }} />
                                ${this.getOptionDisplayValue(item)}
                                <span class="rw-hits">(${item.hits})</span>
                            </label>
                        </div>
                    ` : nothing}
                    `;
                })}
            ${this.result.available.length > 10 ? html`
                ${this.showAll ? html`
                    <relewise-button
                        button-text=${localization?.showLess ?? 'Show Less'}
                        class="rw-show-more"
                        @click=${() => this.showAll = false}>
                    </relewise-button>` : html`
                    <relewise-button
                        button-text=${localization?.showMore ?? 'Show More'}
                        class="rw-show-more"
                        @click=${() => this.showAll = true}>
                    </relewise-button>`}    
                ` : nothing}
        </div>
        `;
    }

    static styles = [theme, css`
        :host {
            border-radius: var(--relewise-checklist-facet-border-radius, 1rem);
            border-color: var(--relewise-checklist-facet-border-color, lightgray);
            background-color: var(--relewise-checklist-facet-background-color, lightgray);
            height: fit-content;
        }

        .rw-label {
            cursor: pointer;
            display: block;
            padding-left: 1.5em;
            text-indent: -1.5rem; 
            word-break: break-all
        }

        .rw-label input {
            cursor: pointer;
        }

        .rw-facet-content {
            margin: .5rem;
        }

        .rw-show-more {
            --relewise-button-text-color: var(--relewise-checklist-facet-show-more-text-color, black);
        }

        .rw-hits {
            color: var(--relewise-checklist-facet-hits-color, gray);
            font-size: var(--relewise-checklist-facet-hits-font-size, .75rem);
        }
    `];
}