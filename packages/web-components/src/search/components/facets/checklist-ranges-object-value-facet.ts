import { DecimalNullableChainableRangeAvailableFacetValue, PriceRangesFacetResult } from '@relewise/client';
import { property } from 'lit/decorators.js';
import { ChecklistFacetBase } from './checklist-facet-base';

export class ChecklistRangesObjectValueFacet extends ChecklistFacetBase {

    @property({ type: Object })
    result: PriceRangesFacetResult | null = null;

    handleChange(e: Event, item: DecimalNullableChainableRangeAvailableFacetValue) {
        const checkbox = e.target as HTMLInputElement;

        if (!item.value || !item.value.upperBoundExclusive || !item.value.lowerBoundInclusive || !this.result) {
            return;
        }

        if (checkbox.checked) {
            this.selectedValues.push(`${item.value.lowerBoundInclusive}-${item.value.upperBoundExclusive}`);
        } else {
            const newValue =  this.selectedValues.filter(x => x !== `${item.value!.lowerBoundInclusive}-${item.value!.upperBoundExclusive}`);
            this.selectedValues = newValue;
        }

        this.updateUrlState();
    }

    getOptionDisplayValue(item: DecimalNullableChainableRangeAvailableFacetValue): string {
        if (!item.value || !item.value.lowerBoundInclusive || !item.value.upperBoundExclusive) {
            return '';
        }
     
        return `${item.value.lowerBoundInclusive} - ${item.value.upperBoundExclusive}`;
    }

    shouldOptionBeChecked(item: DecimalNullableChainableRangeAvailableFacetValue): boolean {
        if (!item.value || !item.value.upperBoundExclusive || !item.value.lowerBoundInclusive) {
            return false;
        }

        return this.selectedValues.filter(selectedValue => selectedValue === `${item.value!.lowerBoundInclusive}-${item.value!.upperBoundExclusive}`).length > 0;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-checklist-ranges-object-value-facet': ChecklistRangesObjectValueFacet;
    }
}