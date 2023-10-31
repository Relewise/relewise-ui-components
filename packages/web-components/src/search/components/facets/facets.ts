import { BrandFacetResult, CategoryFacetResult, CategoryHierarchyFacetResult, ContentAssortmentFacetResult, ContentDataBooleanValueFacetResult, ContentDataDoubleRangeFacetResult, ContentDataDoubleRangesFacetResult, ContentDataDoubleValueFacetResult, ContentDataIntegerValueFacetResult, ContentDataObjectFacetResult, ContentDataStringValueFacetResult, DataObjectBooleanValueFacetResult, DataObjectDoubleRangeFacetResult, DataObjectDoubleRangesFacetResult, DataObjectDoubleValueFacetResult, DataObjectFacetResult, DataObjectStringValueFacetResult, PriceRangeFacetResult, PriceRangesFacetResult, ProductAssortmentFacetResult, ProductCategoryAssortmentFacetResult, ProductCategoryDataBooleanValueFacetResult, ProductCategoryDataDoubleRangeFacetResult, ProductCategoryDataDoubleRangesFacetResult, ProductCategoryDataDoubleValueFacetResult, ProductCategoryDataObjectFacetResult, ProductCategoryDataStringValueFacetResult, ProductDataBooleanValueFacetResult, ProductDataDoubleRangeFacetResult, ProductDataDoubleRangesFacetResult, ProductDataDoubleValueFacetResult, ProductDataIntegerValueFacetResult, ProductDataObjectFacetResult, ProductDataStringValueFacetResult, ProductFacetResult, VariantSpecificationFacetResult } from '@relewise/client';
import { LitElement, TemplateResult, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { theme } from '../../../theme';
import { Events, getRelewiseUISearchOptions } from '../../../helpers';;

export class Facets extends LitElement {

    @property({ type: Object, attribute: 'facets-result' })
    facetResult: ProductFacetResult | null | undefined = null;

    @state()
    showFacets: boolean = window.innerWidth >= 1024;

    @state()
    showDimmingOverlay: boolean = false;

    connectedCallback(): void {
        super.connectedCallback();
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 1024) {
                this.showFacets = true;
            } 
        });

        window.addEventListener(Events.dimPreviousResult, () => {
            this.showDimmingOverlay = true;
        });

        window.addEventListener(Events.searchingForProductsCompleted, () => { 
            this.showDimmingOverlay = false;
        });
    }

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
                <relewise-number-range-facet .result=${facet}></relewise-number-range-facet>
            `;
        }

        return html``;
    }
    
    render() {
        const localization = getRelewiseUISearchOptions()?.localization?.facets;
        return html`
            <relewise-button
                button-text=${localization?.toggleButton ?? 'Filters'} 
                class="rw-button rw-facet-button"
                @click=${() => this.showFacets = !this.showFacets}>
                    ${this.showFacets ?
                        html`<relewise-x-icon></relewise-x-icon>` :
                        html`<relewise-filter-icon></relewise-filter-icon>`}
            </relewise-button>
            ${this.showFacets ? 
                html`
                <div class="rw-facets-container">
                    ${this.showDimmingOverlay ? html`<div class="rw-blurring-overlay"></div>`: nothing}
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
            flex-direction: column;
            gap: .5rem;
        }

        .rw-facet-button {
            margin-bottom: .5rem;
        }

        @media (min-width: 480px) and (max-width: 1023px) {
            .rw-facets-container {
                display: grid;
                grid-template-columns: repeat(2,1fr);
            }
        }

        @media (min-width: 1024px) {
            .rw-facets-container {
                margin-right: .5rem;
                min-width: 15rem;
            }

            .rw-facet-button {
                display: none;
            }
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-facets': Facets;
    }
}