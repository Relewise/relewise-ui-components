import { BrandFacetResult, BrandNameAndIdResultAvailableFacetValue, CategoryFacetResult, CategoryNameAndIdResultAvailableFacetValue } from '@relewise/client';
import { property } from 'lit/decorators.js';
import { ChecklistFacetBase } from './checklist-facet-base';

export class ChecklistObjectValueFacet extends ChecklistFacetBase {

    @property({ type: Object })
    result: BrandFacetResult | CategoryFacetResult | null = null;

    handleChange(e: Event, item: BrandNameAndIdResultAvailableFacetValue | CategoryNameAndIdResultAvailableFacetValue) {
        const checkbox = e.target as HTMLInputElement;

        if (!item.value || !item.value.id || !this.result) {
            return;
        }

        if (checkbox.checked) {
            this.selectedValues.push(item.value.id);
        } else {
            const newValue = this.selectedValues.filter(x => x !== item.value?.id);
            this.selectedValues = newValue;
        }

        this.updateUrlState();
    }

    getOptionDisplayValue(item: BrandNameAndIdResultAvailableFacetValue | CategoryNameAndIdResultAvailableFacetValue): string {
        if (!item.value || !item.value.displayName) {
            return '';
        }

        return item.value.displayName;
    }

    shouldOptionBeChecked(item: BrandNameAndIdResultAvailableFacetValue | CategoryNameAndIdResultAvailableFacetValue): boolean {
        if (!item.value || !item.value.id) {
            return false;
        }

        return item.selected;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-checklist-object-value-facet': ChecklistObjectValueFacet;
    }
}