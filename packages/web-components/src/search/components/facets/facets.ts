import { ProductFacetResult } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { theme } from '../../../theme';

export class Facets extends LitElement {

    @property({ type: Object, attribute: 'facets-result' })
    facetResult: ProductFacetResult | null | undefined = null;

    @property({ attribute: 'save-selected-number-range-text'})
    saveSelectedRangeText: string = 'Save';

    @state()
    showFacets: boolean = window.innerWidth >= 1024;
    
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
                        if (item.$type.includes('PriceRangesFacetResult')) {
                            return html`
                                <relewise-checklist-ranges-object-value-facet .result=${item}>
                                </relewise-checklist-ranges-object-value-facet>
                            `;
                        }

                        if (item.$type.includes('ProductAssortmentFacetResult')) {
                            return html`
                                <relewise-checklist-number-value-facet .result=${item}>
                                </relewise-checklist-number-value-facet>
                            `;
                        }

                        if (item.$type.includes('BrandFacetResult') ||
                            item.$type.includes('CategoryFacetResult')) {
                            return html`
                                <relewise-checklist-object-value-facet .result=${item}>
                                </relewise-checklist-object-value-facet>
                            `;
                        }

                        if (item.$type.includes('ProductDataBooleanValueFacetResult')) {
                            return html`
                                <relewise-checklist-boolean-value-facet .result=${item}>
                                </relewise-checklist-boolean-value-facet>
                            `;
                        }

                        if (item.$type.includes('ProductDataStringValueFacetResult')) {
                            return html`
                                <relewise-checklist-string-value-facet .result=${item}>
                                </relewise-checklist-string-value-facet>
                            `;
                        }

                        if (item.$type.includes('ProductDataDoubleRangeFacetResult') ||
                            item.$type.includes('PriceRangeFacetResult')) {
                            return html`
                                <relewise-number-range-facet 
                                    .result=${item}
                                    .saveSelectedRangeText=${this.saveSelectedRangeText}>
                                </relewise-number-range-facet>
                            `;
                        }
                        return nothing;
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