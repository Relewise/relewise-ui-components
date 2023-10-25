import { BrandFacetResult, CategoryFacetResult, CategoryHierarchyFacetResult, ContentAssortmentFacetResult, ContentDataBooleanValueFacetResult, ContentDataDoubleRangeFacetResult, ContentDataDoubleRangesFacetResult, ContentDataDoubleValueFacetResult, ContentDataIntegerValueFacetResult, ContentDataObjectFacetResult, ContentDataStringValueFacetResult, DataObjectBooleanValueFacetResult, DataObjectDoubleRangeFacetResult, DataObjectDoubleRangesFacetResult, DataObjectDoubleValueFacetResult, DataObjectFacetResult, DataObjectStringValueFacetResult, PriceRangeFacetResult, PriceRangesFacetResult, ProductAssortmentFacetResult, ProductCategoryAssortmentFacetResult, ProductCategoryDataBooleanValueFacetResult, ProductCategoryDataDoubleRangeFacetResult, ProductCategoryDataDoubleRangesFacetResult, ProductCategoryDataDoubleValueFacetResult, ProductCategoryDataObjectFacetResult, ProductCategoryDataStringValueFacetResult, ProductDataBooleanValueFacetResult, ProductDataDoubleRangeFacetResult, ProductDataDoubleRangesFacetResult, ProductDataDoubleValueFacetResult, ProductDataIntegerValueFacetResult, ProductDataObjectFacetResult, ProductDataStringValueFacetResult, ProductFacetResult, VariantSpecificationFacetResult } from '@relewise/client';
import { LitElement, TemplateResult, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { theme } from '../../../theme';

export class Facets extends LitElement {

    @property({ type: Object, attribute: 'facets-result' })
    facetResult: ProductFacetResult | null | undefined = null;

    @property({ attribute: 'save-selected-number-range-text'})
    saveSelectedRangeText: string = 'Save';

    @state()
    showFacets: boolean = window.innerWidth >= 1024;

    renderFacet(facet: ProductAssortmentFacetResult | ContentAssortmentFacetResult | ProductCategoryAssortmentFacetResult | BrandFacetResult | CategoryFacetResult | CategoryHierarchyFacetResult | ContentDataObjectFacetResult | ContentDataDoubleRangeFacetResult | ContentDataDoubleRangesFacetResult | ContentDataStringValueFacetResult | ContentDataBooleanValueFacetResult | ContentDataDoubleValueFacetResult | ContentDataIntegerValueFacetResult | DataObjectFacetResult | DataObjectDoubleRangeFacetResult | DataObjectDoubleRangesFacetResult | DataObjectStringValueFacetResult | DataObjectBooleanValueFacetResult | DataObjectDoubleValueFacetResult | PriceRangeFacetResult | PriceRangesFacetResult | ProductCategoryDataObjectFacetResult | ProductCategoryDataDoubleRangeFacetResult | ProductCategoryDataDoubleRangesFacetResult | ProductCategoryDataStringValueFacetResult | ProductCategoryDataBooleanValueFacetResult | ProductCategoryDataDoubleValueFacetResult | ProductDataObjectFacetResult | ProductDataDoubleRangeFacetResult | ProductDataDoubleRangesFacetResult | ProductDataStringValueFacetResult | ProductDataBooleanValueFacetResult | ProductDataDoubleValueFacetResult | ProductDataIntegerValueFacetResult | VariantSpecificationFacetResult): TemplateResult<1> {
        if (facet.$type.includes('PriceRangesFacetResult') || 
            facet.$type.includes('ProductDataDoubleRangesFacetResult')) {
            return html`
                <relewise-checklist-ranges-object-value-facet .result=${facet}></relewise-checklist-ranges-object-value-facet>
            `;
        }
        if (facet.$type.includes('ProductAssortmentFacetResult') ||
            facet.$type.includes('ProductDataDoubleValueFacetResult')) {
            return html`
                <relewise-checklist-number-value-facet .result=${facet}></relewise-checklist-number-value-facet>
            `;
        }

        if (facet.$type.includes('BrandFacetResult') ||
            facet.$type.includes('CategoryFacetResult')) {
            return html`
                <relewise-checklist-object-value-facet .result=${facet}></relewise-checklist-object-value-facet>
            `;
        }

        if (facet.$type.includes('ProductDataBooleanValueFacetResult')) {
            return html`
                <relewise-checklist-boolean-value-facet .result=${facet}></relewise-checklist-boolean-value-facet>
            `;
        }

        if (facet.$type.includes('ProductDataStringValueFacetResult')) {
            return html`
                <relewise-checklist-string-value-facet .result=${facet}></relewise-checklist-string-value-facet>
            `;
        }

        if (facet.$type.includes('ProductDataDoubleRangeFacetResult') ||
            facet.$type.includes('PriceRangeFacetResult')) {
            return html`
                <relewise-number-range-facet 
                    .result=${facet}
                    .saveSelectedRangeText=${this.saveSelectedRangeText}>
                </relewise-number-range-facet>
            `;
        }

        return html``;
    }
    
    render() {
        return html`
            <relewise-button
                button-text="Filter" 
                class="rw-button"
                @click=${() => this.showFacets = !this.showFacets}>
                    ${this.showFacets ?
                        html`<relewise-x-icon></relewise-x-icon>` :
                        html`<relewise-filter-icon></relewise-filter-icon>`}
            </relewise-button>
            ${this.showFacets ? 
                html`
                <div class="rw-facets-container">
                    ${this.facetResult?.items?.map(item => {
                        return this.renderFacet(item);
                    })}
                </div>
            ` : nothing}
        `;
    }

    static styles = [theme, css`
        .rw-facets-container {
            display: flex;
        }

        @media (min-width: 1024px) {
            .rw-facets-container {
                flex-direction: column;
            }
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-facets': Facets;
    }
}