import { BrandFacetResult, CategoryFacetResult, CategoryHierarchyFacetResult, ContentAssortmentFacetResult, ContentDataBooleanValueFacetResult, ContentDataDoubleRangeFacetResult, ContentDataDoubleRangesFacetResult, ContentDataDoubleValueFacetResult, ContentDataIntegerValueFacetResult, ContentDataObjectFacetResult, ContentDataStringValueFacetResult, DataObjectBooleanValueFacetResult, DataObjectDoubleRangeFacetResult, DataObjectDoubleRangesFacetResult, DataObjectDoubleValueFacetResult, DataObjectFacetResult, DataObjectStringValueFacetResult, PriceRangeFacetResult, PriceRangesFacetResult, ProductAssortmentFacetResult, ProductCategoryAssortmentFacetResult, ProductCategoryDataBooleanValueFacetResult, ProductCategoryDataDoubleRangeFacetResult, ProductCategoryDataDoubleRangesFacetResult, ProductCategoryDataDoubleValueFacetResult, ProductCategoryDataObjectFacetResult, ProductCategoryDataStringValueFacetResult, ProductDataBooleanValueFacetResult, ProductDataDoubleRangeFacetResult, ProductDataDoubleRangesFacetResult, ProductDataDoubleValueFacetResult, ProductDataIntegerValueFacetResult, ProductDataObjectFacetResult, ProductDataStringValueFacetResult, ProductFacetResult, VariantSpecificationFacetResult } from '@relewise/client';
import { LitElement, TemplateResult, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { theme } from '../../../theme';
import { Events, getRelewiseUISearchOptions } from '../../../helpers';;

export class Facets extends LitElement {

    @property({ type: Object, attribute: 'facets-result' })
    facetResult: ProductFacetResult | null | undefined = null;

    @property({ type: Array, attribute: 'labels' })
    labels: string[] = [];

    @state()
    showFacets: boolean = window.innerWidth >= 1024;

    @state()
    showDimmingOverlay: boolean = false;

    connectedCallback(): void {
        super.connectedCallback();
        
        window.addEventListener('resize', () => this.handleResizeEvent());
        window.addEventListener(Events.dimPreviousResult, () => this.handleDimPreviousResultEvent());
        window.addEventListener(Events.searchingForProductsCompleted, () => this.handleSearchingForProductsCompletedEvent());
    }

    disconnectedCallback(): void {
        window.removeEventListener('resize', this.handleResizeEvent);
        window.removeEventListener(Events.dimPreviousResult, this.handleDimPreviousResultEvent);
        window.removeEventListener(Events.searchingForProductsCompleted, this.handleSearchingForProductsCompletedEvent);

        super.disconnectedCallback();
    }

    handleResizeEvent() {
        if (window.innerWidth >= 1024) {
            this.showFacets = true;
        } 
    }

    handleDimPreviousResultEvent() {
        this.showDimmingOverlay = true;

    }

    handleSearchingForProductsCompletedEvent() {
        this.showDimmingOverlay = false;
    }

    renderFacet(label: string, facet: ProductAssortmentFacetResult | ContentAssortmentFacetResult | ProductCategoryAssortmentFacetResult | BrandFacetResult | CategoryFacetResult | CategoryHierarchyFacetResult | ContentDataObjectFacetResult | ContentDataDoubleRangeFacetResult | ContentDataDoubleRangesFacetResult | ContentDataStringValueFacetResult | ContentDataBooleanValueFacetResult | ContentDataDoubleValueFacetResult | ContentDataIntegerValueFacetResult | DataObjectFacetResult | DataObjectDoubleRangeFacetResult | DataObjectDoubleRangesFacetResult | DataObjectStringValueFacetResult | DataObjectBooleanValueFacetResult | DataObjectDoubleValueFacetResult | PriceRangeFacetResult | PriceRangesFacetResult | ProductCategoryDataObjectFacetResult | ProductCategoryDataDoubleRangeFacetResult | ProductCategoryDataDoubleRangesFacetResult | ProductCategoryDataStringValueFacetResult | ProductCategoryDataBooleanValueFacetResult | ProductCategoryDataDoubleValueFacetResult | ProductDataObjectFacetResult | ProductDataDoubleRangeFacetResult | ProductDataDoubleRangesFacetResult | ProductDataStringValueFacetResult | ProductDataBooleanValueFacetResult | ProductDataDoubleValueFacetResult | ProductDataIntegerValueFacetResult | VariantSpecificationFacetResult): TemplateResult<1> {
        if (facet.$type.includes('PriceRangesFacetResult') || 
            facet.$type.includes('ProductDataDoubleRangesFacetResult')) {
            return html`
                <relewise-checklist-ranges-object-value-facet
                    .label=${label}
                    .result=${facet}>
                </relewise-checklist-ranges-object-value-facet>
            `;
        }

        if (facet.$type.includes('ProductAssortmentFacetResult') ||
            facet.$type.includes('ProductDataDoubleValueFacetResult')) {
            return html`
                <relewise-checklist-number-value-facet
                    .label=${label}    
                    .result=${facet}>
                </relewise-checklist-number-value-facet>
            `;
        }

        if (facet.$type.includes('BrandFacetResult') ||
            facet.$type.includes('CategoryFacetResult')) {
            return html`
                <relewise-checklist-object-value-facet 
                    .label=${label}
                    .result=${facet}>
                </relewise-checklist-object-value-facet>
            `;
        }

        if (facet.$type.includes('ProductDataBooleanValueFacetResult')) {
            return html`
                <relewise-checklist-boolean-value-facet
                    .label=${label}
                    .result=${facet}>
                </relewise-checklist-boolean-value-facet>
            `;
        }

        if (facet.$type.includes('ProductDataStringValueFacetResult')) {
            return html`
                <relewise-checklist-string-value-facet
                    .label=${label}
                    .result=${facet}>
                </relewise-checklist-string-value-facet>
            `;
        }

        if (facet.$type.includes('ProductDataDoubleRangeFacetResult') ||
            facet.$type.includes('PriceRangeFacetResult')) {
            return html`
                <relewise-number-range-facet
                    .label=${label}
                    .result=${facet}>
                </relewise-number-range-facet>
            `;
        }

        return html``;
    }
    
    render() {
        const localization = getRelewiseUISearchOptions()?.localization?.facets;
        return html`
            <relewise-button
                button-text=${localization?.filter ?? 'Filters'} 
                class="rw-button rw-facet-button"
                @click=${() => this.showFacets = !this.showFacets}>
                    ${this.showFacets ?
                        html`<relewise-x-icon class="rw-icon"></relewise-x-icon>` :
                        html`<relewise-filter-icon class="rw-icon"></relewise-filter-icon>`}
            </relewise-button>
            ${this.showFacets ? 
                html`
                <div class="rw-facets-container">
                    ${this.showDimmingOverlay ? html`<div class="rw-dimming-overlay"></div>`: nothing}
                    ${this.facetResult?.items?.map((item, index) => {
                        return this.renderFacet(this.labels[index], item);
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
            height: 2.5rem;
            border-color: var(--color);
            background-color: var(--color);
            --relewise-button-text-color: black;
        }

        .rw-icon {
            --relewise-icon-color: black;
        }

        @media (min-width: 480px) and (max-width: 1023px) {
            .rw-facets-container {
                display: grid;
                grid-template-columns: repeat(2,1fr);
            }
        }

        @media (min-width: 1024px) {
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