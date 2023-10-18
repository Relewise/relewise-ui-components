import { CategoryFacetResult, CategoryNameAndIdResultAvailableFacetValue, ProductSearchResponse } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events, categoryFacetQueryName, readCurrentUrlStateValues, updateUrlStateValues } from '../../../helpers';
import { theme } from '../../../theme';

export class CategoryFacet extends LitElement {

    @property({ type: Object, attribute: 'search-result' })
    searchResult: ProductSearchResponse | null = null;

    @property()
    search = () => {};

    @property({ attribute: 'label-text' })
    labelText: string = 'Categories';

    @state()
    selectedValues: string[] = [];

    @state()
    showAllCategories: boolean = false;

    connectedCallback(): void {
        super.connectedCallback();
        this.selectedValues = readCurrentUrlStateValues(categoryFacetQueryName);
    }

    handleChange(e: Event, item: CategoryNameAndIdResultAvailableFacetValue) {
        const checkbox = e.target as HTMLInputElement;
        
        if (!item.value || !item.value.id)  {
            return;
        }

        if (checkbox.checked) {
            this.selectedValues.push(item.value.id);
        } else {
            const newValue =  this.selectedValues.filter(x => x !== item.value?.id);
            this.selectedValues = newValue;
        }

        updateUrlStateValues(categoryFacetQueryName, this.selectedValues);
        window.dispatchEvent(new CustomEvent(Events.shouldClearSearchResult));
        window.dispatchEvent(new CustomEvent(Events.shouldPerformSearch));
    }

    render() {
        const categoryFacet = this.searchResult?.facets?.items?.find(x => x.field === 'Category') as CategoryFacetResult;
        
        if (!categoryFacet ||
            !categoryFacet.available ||
            categoryFacet.available.length < 1) {
            return;
        }

        const categoriesToShow = this.showAllCategories
            ? categoryFacet.available
            : categoryFacet.available.slice(0, 10);

        return html`
        <h3>${this.labelText}</h3>
        ${categoriesToShow.map((item, index) => {
                return html`
                ${item.value && item.value.displayName ? html`
                    <div>
                        <input
                            type="checkbox"
                            id=${index}
                            name=${index}
                            ?checked=${this.selectedValues.filter(x => x === item.value?.id).length > 0}
                            @change=${(e: Event) => this.handleChange(e, item)} />
                        <label for=${index}>${item.value?.displayName}</label>
                    </div>
                ` : nothing}
                `;
            })}
        ${this.showAllCategories ? html`
            <relewise-button
                button-text="Show Less"
                class="rw-show-more"
                @click=${() => this.showAllCategories = false}>
            </relewise-button>` : html`
            <relewise-button
                button-text="Show More"
                class="rw-show-more"
                @click=${() => this.showAllCategories = true}>
            </relewise-button>`}
        `;
    }

    static styles = [theme, css`
        .rw-show-more {
            --relewise-button-text-color: black;
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-category-facet': CategoryFacet;
    }
}