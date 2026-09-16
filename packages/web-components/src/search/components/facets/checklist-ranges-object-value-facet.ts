import { ContentDataDoubleRangesFacetResult, DataObjectDoubleRangesFacetResult, DecimalNullableChainableRangeAvailableFacetValue, PriceRangesFacetResult, ProductCategoryDataDoubleRangesFacetResult, ProductDataDoubleRangesFacetResult } from '@relewise/client';
import { property } from 'lit/decorators.js';
import { ChecklistFacetBase } from './checklist-facet-base';

export class ChecklistRangesObjectValueFacet extends ChecklistFacetBase {

    @property({ type: Object })
    result: PriceRangesFacetResult | ProductDataDoubleRangesFacetResult | ContentDataDoubleRangesFacetResult | ProductCategoryDataDoubleRangesFacetResult | DataObjectDoubleRangesFacetResult | null = null;

    handleChange(e: Event, item: DecimalNullableChainableRangeAvailableFacetValue) {
        const checkbox = e.currentTarget as HTMLInputElement;
        if (!item.value || !this.result) {
            return;
        }

        const selectedValue = `${item.value.lowerBoundInclusive}-${item.value.upperBoundExclusive}`;
        if (checkbox.checked) {
            this.selectedValues = [...this.selectedValues, selectedValue];
        } else {
            this.selectedValues = this.selectedValues.filter(value => value !== selectedValue);
        }

        this.updateUrlState(true);
    }

    getOptionDisplayValue(item: DecimalNullableChainableRangeAvailableFacetValue): string {
        if (!item.value) {
            return '';
        }

        return `${item.value.lowerBoundInclusive ?? ''} - ${item.value.upperBoundExclusive ?? ''}`;
    }

    shouldOptionBeChecked(item: DecimalNullableChainableRangeAvailableFacetValue): boolean {
        if (!item.value) {
            return false;
        }

        return this.selectedValues.includes(`${item.value.lowerBoundInclusive}-${item.value.upperBoundExclusive}`);
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-checklist-ranges-object-value-facet': ChecklistRangesObjectValueFacet;
    }
}
