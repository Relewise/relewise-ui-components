import { CategoryFacetResult } from '@relewise/client';
import { property } from 'lit/decorators.js';
import { categoryFacetQueryName, readCurrentUrlStateValues } from '../../../helpers';
import { FacetBase } from './facet-base';
import { FacetResult } from './facet-result';

export class CategoryFacet extends FacetBase {

    facetQueryName: string = categoryFacetQueryName;

    @property({ attribute: 'label-text' })
    labelText: string = 'Categories';
    
    connectedCallback(): void {
        super.connectedCallback();
        this.selectedValues = readCurrentUrlStateValues(categoryFacetQueryName);
    }

    getFacetResults(): FacetResult[] {
        const categoryFacetResult = this.searchResult?.facets?.items?.find(x => x.field === 'Category') as CategoryFacetResult;
        if (!categoryFacetResult || !categoryFacetResult.available) {
            return [];
        }
        return categoryFacetResult.available?.map(x => new FacetResult(x.value?.id ?? null, x.value?.displayName ?? null)) ?? [];
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-category-facet': CategoryFacet;
    }
}