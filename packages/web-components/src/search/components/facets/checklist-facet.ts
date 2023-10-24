import { BooleanAvailableFacetValue, BrandFacetResult, BrandNameAndIdResultAvailableFacetValue, CategoryFacetResult, Int32AvailableFacetValue, ProductAssortmentFacetResult, ProductDataBooleanValueFacetResult, ProductDataStringValueFacetResult, StringAvailableFacetValue } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events, readCurrentUrlStateValues, updateUrlStateValues } from '../../../helpers';
import { theme } from '../../../theme';

export class ChecklistFacet extends LitElement {

    @property({ type: Object })
    result: (BrandFacetResult | CategoryFacetResult | ProductDataStringValueFacetResult | ProductDataBooleanValueFacetResult | ProductAssortmentFacetResult) | null = null;

    @state()
    selectedValues: string[] = [];

    @state()
    showAll: boolean = false;

    @property({ attribute: 'boolean-facet-true-display-value'})
    booleanFacetTrueDisplayValue: string = 'yes';
    
    @property({ attribute: 'boolean-facet-false-display-value'})
    booleanFacetFalseDisplayValue: string = 'no';


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

    handleChange(e: Event, item: BrandNameAndIdResultAvailableFacetValue | StringAvailableFacetValue | BooleanAvailableFacetValue | Int32AvailableFacetValue) {
        const checkbox = e.target as HTMLInputElement;

        if (item.value === undefined || item.value === null || !this.result) {
            return;
        }
        
        let valueToHandle: string | null = null; 
        if (typeof(item.value) === 'string')  {
            valueToHandle = item.value;
        }

        if (typeof(item.value) === 'boolean')  {
            valueToHandle = item.value.toString();
        }

        if (typeof(item.value) === 'object' && 'id' in item.value && item.value.id) {
            valueToHandle = item.value.id;
        }

        if (typeof(item.value) === 'number') {
            valueToHandle = item.value.toString();
        }

        if (!valueToHandle) {
            return;
        }

        if (checkbox.checked) {
            this.selectedValues.push(valueToHandle);
        } else {
            const newValue =  this.selectedValues.filter(x => x !== valueToHandle);
            this.selectedValues = newValue;
        }

        if ('key' in this.result) {
            updateUrlStateValues(this.result.field + this.result.key, this.selectedValues);
        } else {
            updateUrlStateValues(this.result.field, this.selectedValues);
        }

        window.dispatchEvent(new CustomEvent(Events.shouldClearSearchResult));
        window.dispatchEvent(new CustomEvent(Events.shouldPerformSearch));
    }

    getOptionDisplayValue(item: BrandNameAndIdResultAvailableFacetValue | StringAvailableFacetValue | BooleanAvailableFacetValue | Int32AvailableFacetValue): string {
        if (item.value === undefined || item.value === null) {
            return '';
        }

        if (typeof(item.value) === 'string')  {
            return item.value;
        }

        if (typeof(item.value) === 'boolean') {
            return item.value ? this.booleanFacetTrueDisplayValue : this.booleanFacetFalseDisplayValue;
        }

        if (typeof(item.value) === 'object' && 'displayName' in item.value) {
            return item.value.displayName ?? '';
        }

        if (typeof(item.value) === 'number') {
            return item.value.toString();
        }

        return '';
    }

    shouldOptionBeChecked(item: BrandNameAndIdResultAvailableFacetValue | StringAvailableFacetValue | BooleanAvailableFacetValue | Int32AvailableFacetValue): boolean {
        if (item.value === undefined || item.value === null) {
            return false;
        }

        if (typeof(item.value) === 'string')  {
            return this.selectedValues.filter(selectedValue => selectedValue === item.value).length > 0;
        }

        if (typeof(item.value) === 'boolean') {
            return this.selectedValues.filter(selectedValue => selectedValue === item.value.toString()).length > 0;
        }

        if (typeof(item.value) === 'object' && 'id' in item.value && item.value.id) {
            const id = item.value.id;
            return this.selectedValues.filter(selectedValue => selectedValue === id).length > 0;
        }

        if (typeof(item.value) === 'number') {
            return this.selectedValues.filter(selectedValue => selectedValue === item.value?.toString()).length > 0;
        }

        return false;
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
                            <input
                                type="checkbox"
                                id=${index}
                                name=${index}
                                ?checked=${this.shouldOptionBeChecked(item)}
                                @change=${(e: Event) => this.handleChange(e, item)} />
                            <label for=${index}>${this.getOptionDisplayValue(item)}</label>
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
            border: 1px solid;
            border-radius: 1rem;
            border-color: lightgray;
            background-color: lightgray;
            height: fit-content;
            width: fit-content;            
        }

        .rw-facet-content {
            margin: .5rem;
        }

        .rw-show-more {
            --relewise-button-text-color: black;
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-checklist-facet': ChecklistFacet;
    }
}