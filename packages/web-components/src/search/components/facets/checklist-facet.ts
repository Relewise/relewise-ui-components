import { BrandFacetResult, BrandNameAndIdResultAvailableFacetValue, CategoryFacetResult, ProductDataStringValueFacetResult, StringAvailableFacetValue } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events, readCurrentUrlStateValues, updateUrlStateValues } from '../../../helpers';
import { theme } from '../../../theme';

export class ChecklistFacet extends LitElement {

    @property({ type: Object })
    result: (BrandFacetResult | CategoryFacetResult | ProductDataStringValueFacetResult) | null = null;

    @state()
    selectedValues: string[] = [];

    @state()
    showAll: boolean = false;

    @property({ attribute: 'label-text' })
    labelText: string = 'Label';

    connectedCallback(): void {
        super.connectedCallback();
        if (this.result) {
            if ('key' in this.result)  {
                this.selectedValues = readCurrentUrlStateValues(this.result.field + this.result.key);
            } else {
                this.selectedValues = readCurrentUrlStateValues(this.result.field );
            }
        }
    }

    handleChange(e: Event, item: BrandNameAndIdResultAvailableFacetValue | StringAvailableFacetValue) {
        const checkbox = e.target as HTMLInputElement;

        if (!item.value || !this.result) {
            return;
        }
        
        let valueToHandle: string | null = null; 
        if (typeof(item.value) === 'string')  {
            valueToHandle = item.value;
        }

        if (typeof(item.value) === 'object' && 'id' in item.value && item.value.id) {
            valueToHandle = item.value.id;
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

    getOptionDisplayValue(item: BrandNameAndIdResultAvailableFacetValue | StringAvailableFacetValue): string {
        if (!item.value) {
            return '';
        }

        if (typeof(item.value) === 'string')  {
            return item.value;
        }

        if ('displayName' in item.value) {
            return item.value.displayName ?? '';
        }

        return '';
    }

    shouldOptionBeChecked(item: BrandNameAndIdResultAvailableFacetValue | StringAvailableFacetValue): boolean {
        if (!item.value) {
            return false;
        }

        if (typeof(item.value) === 'string')  {
            return this.selectedValues.filter(selectedValue => selectedValue === item.value).length > 0;
        }

        if ('id' in item.value && item.value.id) {
            const id = item.value.id;
            return this.selectedValues.filter(selectedValue => selectedValue === id).length > 0;
        }

        return false;
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
            <h3>${this.labelText}</h3>
            ${facetResultsToShow.map((item, index) => {
                    return html`
                    ${item.value && item.value ? html`
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