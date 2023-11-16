import { ProductDataStringValueFacetResult, StringAvailableFacetValue } from '@relewise/client';
import { property } from 'lit/decorators.js';
import { ChecklistFacetBase } from './checklist-facet-base';

export class ChecklistStringValueFacet extends ChecklistFacetBase {

    @property({ type: Object })
    result: ProductDataStringValueFacetResult | null = null;

    handleChange(e: Event, item: StringAvailableFacetValue) {
        const checkbox = e.target as HTMLInputElement;

        if (!item.value || !this.result) {
            return;
        }

        if (checkbox.checked) {
            this.selectedValues.push(item.value);
        } else {
            const newValue = this.selectedValues.filter(x => x !== item.value);
            this.selectedValues = newValue;
        }

        this.updateUrlState(true);
    }

    getOptionDisplayValue(item: StringAvailableFacetValue): string {
        return item.value ?? '';
    }

    shouldOptionBeChecked(item: StringAvailableFacetValue): boolean {
        if (!item.value) {
            return false;
        }

        return this.selectedValues.filter(selectedValue => selectedValue === item.value).length > 0;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-checklist-string-value-facet': ChecklistStringValueFacet;
    }
}