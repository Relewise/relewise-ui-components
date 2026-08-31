import { ContentDataDoubleRangesFacetResult, DataObjectDoubleRangesFacetResult, DecimalNullableChainableRangeAvailableFacetValue, PriceRangesFacetResult, ProductCategoryDataDoubleRangesFacetResult, ProductDataDoubleRangesFacetResult } from '@relewise/client';
import { property } from 'lit/decorators.js';
import { ChecklistFacetBase } from './checklist-facet-base';
import { deserializeFacetRange, FacetRange, serializeFacetRange } from '../../../helpers/facetRangeUrlCodec';

export class ChecklistRangesObjectValueFacet extends ChecklistFacetBase {

    @property({ type: Object })
    result: PriceRangesFacetResult | ProductDataDoubleRangesFacetResult | ContentDataDoubleRangesFacetResult | ProductCategoryDataDoubleRangesFacetResult | DataObjectDoubleRangesFacetResult | null = null;

    handleChange(e: Event, item: DecimalNullableChainableRangeAvailableFacetValue) {
        const checkbox = e.currentTarget as HTMLInputElement;
        if (!item.value || !this.result) {
            return;
        }

        const range = this.getRange(item);
        const serializedRange = serializeFacetRange(range);
        if (checkbox.checked) {
            this.selectedValues = [...this.selectedValues, serializedRange];
        } else {
            this.selectedValues = this.selectedValues.filter(value => !this.rangesEqual(deserializeFacetRange(value), range));
        }

        this.updateUrlState(true);
    }

    getOptionDisplayValue(item: DecimalNullableChainableRangeAvailableFacetValue): string {
        if (!item.value) {
            return '';
        }

        const range = this.getRange(item);
        if (range.lowerBoundInclusive === null) {
            return range.upperBoundExclusive === null ? '' : `< ${range.upperBoundExclusive}`;
        }

        return range.upperBoundExclusive === null
            ? `≥ ${range.lowerBoundInclusive}`
            : `${range.lowerBoundInclusive} - ${range.upperBoundExclusive}`;
    }

    shouldOptionBeChecked(item: DecimalNullableChainableRangeAvailableFacetValue): boolean {
        if (!item.value) {
            return false;
        }

        const range = this.getRange(item);
        return this.selectedValues.some(value => this.rangesEqual(deserializeFacetRange(value), range));
    }

    private getRange(item: DecimalNullableChainableRangeAvailableFacetValue) {
        return {
            lowerBoundInclusive: item.value?.lowerBoundInclusive ?? null,
            upperBoundExclusive: item.value?.upperBoundExclusive ?? null,
        };
    }

    private rangesEqual(
        first: ReturnType<typeof deserializeFacetRange>,
        second: FacetRange,
    ): boolean {
        return first !== null
            && first.lowerBoundInclusive === second.lowerBoundInclusive
            && first.upperBoundExclusive === second.upperBoundExclusive;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-checklist-ranges-object-value-facet': ChecklistRangesObjectValueFacet;
    }
}
