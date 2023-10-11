import { CategoryFacetResult, ProductSearchResponse } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { categoryFacetQueryName, updateUrlStateValues } from '../../../helpers';
import { theme } from '../../../theme';

export class CategoryFacet extends LitElement {

    @property({ type: Object, attribute: 'search-result' })
    searchResult: ProductSearchResponse | null = null;

    @state()
    categoryFacet: CategoryFacetResult | null = null;

    @state()
    selectedValues: string[] = [];

    connectedCallback(): void {
        super.connectedCallback();

        this.categoryFacet = this.searchResult?.facets?.items?.find(x => x.field === 'Category') as CategoryFacetResult;
    }

    render() {
        console.log('rendered', this.categoryFacet?.available);
        return html`
        <h1>Category Facet</h1>
        ${this.categoryFacet ? html`
            ${this.categoryFacet.available?.map((item, index) => {
                return html`
                ${item.value ? html`
                    <div>
                        <input type="checkbox" id=${index} name=${index} @change=${(e: Event) => {
                            const checkbox = e.target as HTMLInputElement;

                                if (checkbox.checked) {
                                    this.selectedValues.push(item.value.id);
                                } else {
                                    const newValue =  this.selectedValues.filter(x => x !== item.value.id);
                                    console.log(newValue);
                                    this.selectedValues = newValue;
                                }
    
                                updateUrlStateValues(categoryFacetQueryName, this.selectedValues);
                          }} />
                        <label for=${index}>${item.value?.displayName}</label>
                    </div>
                ` : nothing}
                `;
            })}
        ` : nothing}
        `;
    }

    static styles = [theme, css``];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-category-facet': CategoryFacet;
    }
}