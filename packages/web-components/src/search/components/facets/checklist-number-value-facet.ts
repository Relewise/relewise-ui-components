import { BooleanAvailableFacetValue, BrandNameAndIdResultAvailableFacetValue, ContentAssortmentFacetResult, ContentDataDoubleValueFacetResult, ContentDataIntegerValueFacetResult, DataObjectDoubleValueFacetResult, DoubleAvailableFacetValue, Int32AvailableFacetValue, ProductAssortmentFacetResult, ProductCategoryAssortmentFacetResult, ProductCategoryDataDoubleValueFacetResult, ProductDataDoubleValueFacetResult, StringAvailableFacetValue } from '@relewise/client';
import { property } from 'lit/decorators.js';
import { ChecklistFacetBase } from './checklist-facet-base';

export class ChecklistNumberValueFacet extends ChecklistFacetBase {

    @property({ type: Object })
    result: ProductAssortmentFacetResult | ProductDataDoubleValueFacetResult | ContentAssortmentFacetResult | ContentDataDoubleValueFacetResult | ContentDataIntegerValueFacetResult | ProductCategoryAssortmentFacetResult | ProductCategoryDataDoubleValueFacetResult | DataObjectDoubleValueFacetResult | null = null;

    handleChange(e: Event, item: Int32AvailableFacetValue | DoubleAvailableFacetValue) {
        const checkbox = e.currentTarget as HTMLInputElement;

        if (item.value === null || item.value === undefined || !this.result) {
            return;
        }

        if (checkbox.checked) {
            this.selectedValues = [...this.selectedValues, item.value.toString()];
        } else {
            const newValue = this.selectedValues.filter(x => x !== item.value.toString());
            this.selectedValues = newValue;
        }

        this.updateUrlState(true);
    }

    getOptionDisplayValue(item: Int32AvailableFacetValue | DoubleAvailableFacetValue): string {
        if (item.value === null || item.value === undefined) {
            return '';
        }

        return item.value.toString();
    }

    shouldOptionBeChecked(item: BrandNameAndIdResultAvailableFacetValue | StringAvailableFacetValue | BooleanAvailableFacetValue | Int32AvailableFacetValue | DoubleAvailableFacetValue): boolean {
        if (item.value === null || item.value === undefined) {
            return false;
        }

        return item.selected;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-checklist-number-value-facet': ChecklistNumberValueFacet;
    }
}
