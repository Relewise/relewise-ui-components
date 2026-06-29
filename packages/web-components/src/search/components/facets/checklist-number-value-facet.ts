import { BooleanAvailableFacetValue, BrandNameAndIdResultAvailableFacetValue, ContentAssortmentFacetResult, ContentDataDoubleValueFacetResult, ContentDataIntegerValueFacetResult, DoubleAvailableFacetValue, Int32AvailableFacetValue, ProductAssortmentFacetResult, ProductCategoryAssortmentFacetResult, ProductCategoryDataDoubleValueFacetResult, ProductDataDoubleValueFacetResult, StringAvailableFacetValue } from '@relewise/client';
import { property } from 'lit/decorators.js';
import { ChecklistFacetBase } from './checklist-facet-base';

export class ChecklistNumberValueFacet extends ChecklistFacetBase {

    @property({ type: Object })
    result: ProductAssortmentFacetResult | ProductDataDoubleValueFacetResult | ContentAssortmentFacetResult | ContentDataDoubleValueFacetResult | ContentDataIntegerValueFacetResult | ProductCategoryAssortmentFacetResult | ProductCategoryDataDoubleValueFacetResult | null = null;

    handleChange(e: Event, item: Int32AvailableFacetValue | DoubleAvailableFacetValue) {
        const checkbox = e.target as HTMLInputElement;

        if (!item.value || !this.result) {
            return;
        }

        if (checkbox.checked) {
            this.selectedValues.push(item.value.toString());
        } else {
            const newValue = this.selectedValues.filter(x => x !== item.value.toString());
            this.selectedValues = newValue;
        }

        this.updateUrlState(true);
    }

    getOptionDisplayValue(item: Int32AvailableFacetValue | DoubleAvailableFacetValue): string {
        if (!item.value) {
            return '';
        }

        return item.value.toString();
    }

    shouldOptionBeChecked(item: BrandNameAndIdResultAvailableFacetValue | StringAvailableFacetValue | BooleanAvailableFacetValue | Int32AvailableFacetValue | DoubleAvailableFacetValue): boolean {
        if (!item.value) {
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
