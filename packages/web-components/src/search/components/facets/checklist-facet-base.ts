import { BooleanAvailableFacetValue, BrandFacetResult, BrandNameAndIdResultAvailableFacetValue, CategoryFacetResult, DecimalNullableChainableRangeAvailableFacetValue, Int32AvailableFacetValue, PriceRangesFacetResult, ProductAssortmentFacetResult, ProductDataBooleanValueFacetResult, ProductDataDoubleRangesFacetResult, ProductDataDoubleValueFacetResult, ProductDataStringValueFacetResult, StringAvailableFacetValue } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events, readCurrentUrlStateValues, updateUrlStateValues } from '../../../helpers';
import { theme } from '../../../theme';

export abstract class ChecklistFacetBase extends LitElement {

    abstract handleChange(e: Event, item: BrandNameAndIdResultAvailableFacetValue | StringAvailableFacetValue | BooleanAvailableFacetValue | Int32AvailableFacetValue | DecimalNullableChainableRangeAvailableFacetValue): void;
    
    abstract getOptionDisplayValue(item: BrandNameAndIdResultAvailableFacetValue | StringAvailableFacetValue | BooleanAvailableFacetValue | Int32AvailableFacetValue | DecimalNullableChainableRangeAvailableFacetValue): string;

    abstract shouldOptionBeChecked(item: BrandNameAndIdResultAvailableFacetValue | StringAvailableFacetValue | BooleanAvailableFacetValue | Int32AvailableFacetValue | DecimalNullableChainableRangeAvailableFacetValue): boolean;

    @property({ type: Object })
    result: (BrandFacetResult | CategoryFacetResult | ProductDataStringValueFacetResult | ProductDataBooleanValueFacetResult | ProductAssortmentFacetResult | PriceRangesFacetResult | ProductDataDoubleRangesFacetResult | ProductDataDoubleValueFacetResult) | null = null;

    @state()
    selectedValues: string[] = [];

    @state()
    showAll: boolean = false;

    connectedCallback(): void {
        super.connectedCallback();
        if (this.result) {
            if ('key' in this.result)  {
                this.selectedValues = readCurrentUrlStateValues(this.result.field + this.result.key);
            } else {
                this.selectedValues = readCurrentUrlStateValues(this.result.field);
            }
        }
    }

    getLabelDisplayValue(): string {
        if (!this.result) {
            return '';
        }  

        if ('key' in this.result && this.result.key) {
            return this.result.key;
        }

        return this.result.field;
    }

    updateUrlState() {
        if (!this.result) {
            return;
        }  

        if ('key' in this.result) {
            updateUrlStateValues(this.result.field + this.result.key, this.selectedValues);
        } else {
            updateUrlStateValues(this.result.field, this.selectedValues);
        }

        window.dispatchEvent(new CustomEvent(Events.search));
    }

    render() {
        if (!this.result || !this.result.available || this.result?.available.length < 1) {
            return;
        }

        const facetResultsToShow = this.showAll
            ? this.result.available
            : this.result.available.slice(0, 10);

        return html`
        <div class="rw-facet-content">
            <h3>${this.getLabelDisplayValue()}</h3>
            ${facetResultsToShow.map((item, index) => {
                    return html`
                    ${item.value !== undefined ? html`
                        <div>
                            <label class="rw-label" for=${`${this.result?.field}-${this.result?.$type}-${index}`}>
                                <input
                                    type="checkbox"
                                    id=${`${this.result?.field}-${this.result?.$type}-${index}`}
                                    name=${index}
                                    ?checked=${this.shouldOptionBeChecked(item)}
                                    @change=${(e: Event) => this.handleChange(e, item)} />
                                ${this.getOptionDisplayValue(item)}
                            </label>
                        </div>
                    ` : nothing}
                    `;
                })}
            ${this.result.available.length > 10 ? html`
                ${this.showAll ? html`
                    <relewise-button
                        button-text="Show Less"
                        class="rw-show-more"
                        @click=${() => this.showAll = false}>
                    </relewise-button>` : html`
                    <relewise-button
                        button-text="Show More"
                        class="rw-show-more"
                        @click=${() => this.showAll = true}>
                    </relewise-button>`}    
                ` : nothing}
        </div>
        `;
    }

    static styles = [theme, css`
        :host {
            border-radius: 1rem;
            border-color: lightgray;
            background-color: lightgray;
            height: fit-content;
        }

        .rw-label {
            cursor: pointer;
            display: block;
            padding-left: 1.5em;
            text-indent: -1.5rem; 
        }

        .rw-label input {
            cursor: pointer;
        }

        .rw-facet-content {
            margin: .5rem;
        }

        .rw-show-more {
            --relewise-button-text-color: black;
        }
    `];
}