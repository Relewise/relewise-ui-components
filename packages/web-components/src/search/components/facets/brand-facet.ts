import { BrandFacetResult } from '@relewise/client';
import { property } from 'lit/decorators.js';
import { brandFacetQueryName, categoryFacetQueryName, readCurrentUrlStateValues } from '../../../helpers';
import { FacetBase } from './facet-base';
import { FacetResult } from './facet-result';

export class BrandFacet extends FacetBase {

    facetQueryName: string = brandFacetQueryName;

    @property({ attribute: 'label-text' })
    labelText: string = 'Brands';
    
    connectedCallback(): void {
        super.connectedCallback();
        this.selectedValues = readCurrentUrlStateValues(categoryFacetQueryName);
    }

    getFacetResults(): FacetResult[] {
        const brandFacetResult = this.searchResult?.facets?.items?.find(x => x.field === 'Brand') as BrandFacetResult;
        if (!brandFacetResult || !brandFacetResult.available) {
            return [];
        }
        return brandFacetResult.available?.map(x => new FacetResult(x.value?.id ?? null, x.value?.displayName ?? null)) ?? [];
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-brand-facet': BrandFacet;
    }
}