import { CategoryFacetResult, CategoryNameAndIdResultAvailableFacetValue, ProductSearchResponse } from '@relewise/client';
import { LitElement, PropertyValues, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { categoryFacetQueryName, updateUrlStateValues } from '../../../helpers';
import { theme } from '../../../theme';

export class CategoryFacet extends LitElement {

    @property({ type: Object, attribute: 'search-result' })
    searchResult: ProductSearchResponse | null = null;

    @property({ attribute: 'label-text' })
    labelText: string = 'Categories';

    @state()
    categoryFacet: CategoryFacetResult | null = null;

    @state()
    selectedValues: string[] = [];

    connectedCallback(): void {
        super.connectedCallback();
    }

    updated(changedProperties: PropertyValues) {
        super.updated(changedProperties);
        if (changedProperties.has('searchResult')) {
            this.categoryFacet = this.searchResult?.facets?.items?.find(x => x.field === 'Category') as CategoryFacetResult;
        }
    }

    handleChange(e: Event, item: CategoryNameAndIdResultAvailableFacetValue) {
        const checkbox = e.target as HTMLInputElement;
        
        if (!item.value || !item.value.displayName)  {
            return;
        }

        if (checkbox.checked) {
            this.selectedValues.push(item.value.displayName);
        } else {
            const newValue =  this.selectedValues.filter(x => x !== item.value?.displayName);
            console.log(newValue);
            this.selectedValues = newValue;
        }

        updateUrlStateValues(categoryFacetQueryName, this.selectedValues);
    }

    render() {
        return html`
        ${this.categoryFacet && this.categoryFacet.available && this.categoryFacet.available.length > 0 ? html`
        <h3>${this.labelText}</h3>
        ${this.categoryFacet.available.map((item, index) => {
                return html`
                ${item.value && item.value.displayName ? html`
                    <div>
                        <input
                            type="checkbox"
                            id=${index}
                            name=${index}
                            @change=${(e: Event) => this.handleChange(e, item)} />
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