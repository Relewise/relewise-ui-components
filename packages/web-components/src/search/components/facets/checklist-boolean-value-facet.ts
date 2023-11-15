import { BooleanAvailableFacetValue, ProductDataBooleanValueFacetResult } from '@relewise/client';
import { property } from 'lit/decorators.js';
import { getRelewiseUISearchOptions } from '../../../helpers';
import { ChecklistFacetBase } from './checklist-facet-base';

export class ChecklistBooleanValueFacet extends ChecklistFacetBase {

    @property({ type: Object })
    result: ProductDataBooleanValueFacetResult | null = null;

    handleChange(e: Event, item: BooleanAvailableFacetValue) {
        const checkbox = e.target as HTMLInputElement;

        if (item.value === undefined || item.value === null || !this.result) {
            return;
        }

        if (checkbox.checked) {
            this.selectedValues.push(item.value.toString());
        } else {
            const newValue = this.selectedValues.filter(x => x !== item.value.toString());
            this.selectedValues = newValue;
        }

        this.updateUrlState();
    }

    getOptionDisplayValue(item: BooleanAvailableFacetValue): string {
        if (item.value === undefined || item.value === null) {
            return '';
        }

        const localization = getRelewiseUISearchOptions()?.localization?.facets;

        return item.value ? localization?.yes ?? 'Yes' : localization?.no ?? 'No';
    }

    shouldOptionBeChecked(item: BooleanAvailableFacetValue): boolean {
        if (item.value === undefined || item.value === null) {
            return false;
        }

        return this.selectedValues.filter(selectedValue => selectedValue === item.value.toString()).length > 0;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-checklist-boolean-value-facet': ChecklistBooleanValueFacet;
    }
}