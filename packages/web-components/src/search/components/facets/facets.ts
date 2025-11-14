import { ProductFacetResult } from '@relewise/client';
import { LitElement, TemplateResult, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { FacetResult } from '../../types';
import { Events, getRelewiseUISearchOptions } from '../../../helpers';
import { theme } from '../../../theme';

export class Facets extends LitElement {

    @property({ type: Object, attribute: 'facets-result' })
    facetResult: ProductFacetResult | null | undefined = null;

    @property({ type: Array, attribute: 'labels' })
    labels: string[] = [];

    @state()
    showFacets: boolean = window.innerWidth >= 1024;

    @state()
    showDimmingOverlay: boolean = false;

    handleResizeEventBound = this.handleResizeEvent.bind(this);
    handleDimPreviousResultEventBound = this.handleDimPreviousResultEvent.bind(this);
    handleSearchingForProductsCompletedEventBound = this.handleSearchingForProductsCompletedEvent.bind(this);

    connectedCallback(): void {
        super.connectedCallback();

        window.addEventListener('resize', this.handleResizeEventBound);
        window.addEventListener(Events.dimPreviousResult, this.handleDimPreviousResultEventBound);
        window.addEventListener(Events.searchingForProductsCompleted, this.handleSearchingForProductsCompletedEventBound);
    }

    disconnectedCallback(): void {
        window.removeEventListener('resize', this.handleResizeEventBound);
        window.removeEventListener(Events.dimPreviousResult, this.handleDimPreviousResultEventBound);
        window.removeEventListener(Events.searchingForProductsCompleted, this.handleSearchingForProductsCompletedEventBound);

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

    renderFacet(label: string, facetResult: FacetResult, styling: string, isLast: boolean): TemplateResult<1> | typeof nothing {
        if ('available' in facetResult && 
           (!Array.isArray(facetResult.available) || facetResult.available.length === 0) && 
           (facetResult.available && !('value' in facetResult.available))) {
            return nothing;
        }

        if (facetResult.$type.includes('PriceRangesFacetResult') ||
            facetResult.$type.includes('ProductDataDoubleRangesFacetResult')) {
            return html`
                <relewise-checklist-ranges-object-value-facet
                    part="container"
                    exportparts="title, input, label, value, hits"
                    style="${isLast ? 'border-bottom: 0; padding-bottom: 0;' : ''}"
                    .label=${label}
                    .result=${facetResult}
                    class=${styling}>
                </relewise-checklist-ranges-object-value-facet>
            `;
        }

        if (facetResult.$type.includes('ProductAssortmentFacetResult') ||
            facetResult.$type.includes('ProductDataDoubleValueFacetResult')) {
            return html`
                <relewise-checklist-number-value-facet
                    .label=${label}    
                    part="container"
                    exportparts="title, input, label, value, hits"
                    style="${isLast ? 'border-bottom: 0; padding-bottom: 0;' : ''}"
                    .result=${facetResult}
                    class=${styling}>
                </relewise-checklist-number-value-facet>
            `;
        }

        if (facetResult.$type.includes('BrandFacetResult') ||
            facetResult.$type.includes('CategoryFacetResult')) {
            return html`
                <relewise-checklist-object-value-facet 
                    .label=${label}
                    part="container"
                    exportparts="title, input, label, value, hits"
                    style="${isLast ? 'border-bottom: 0; padding-bottom: 0;' : ''}"
                    .result=${facetResult}
                    class=${styling}>
                </relewise-checklist-object-value-facet>
            `;
        }

        if (facetResult.$type.includes('ProductDataBooleanValueFacetResult')) {
            return html`
                <relewise-checklist-boolean-value-facet
                    .label=${label}
                    part="container"
                    exportparts="title, input, label, value, hits"
                    style="${isLast ? 'border-bottom: 0; padding-bottom: 0;' : ''}"
                    .result=${facetResult}
                    class=${styling}>
                </relewise-checklist-boolean-value-facet>
            `;
        }

        if (facetResult.$type.includes('ProductDataStringValueFacetResult')) {
            return html`
                <relewise-checklist-string-value-facet
                    .label=${label}
                    part="container"
                    exportparts="title, input, label, value, hits"
                    style="${isLast ? 'border-bottom: 0; padding-bottom: 0;' : ''}"
                    .result=${facetResult}
                    class=${styling}>
                </relewise-checklist-string-value-facet>
            `;
        }

        if (facetResult.$type.includes('ProductDataDoubleRangeFacetResult') ||
            facetResult.$type.includes('PriceRangeFacetResult')) {
            return html`
                <relewise-number-range-facet
                    .label=${label}
                    part="container"
                    exportparts="title, input"
                    .result=${facetResult}
                    style="${isLast ? 'border-bottom: 0; padding-bottom: 0;' : ''}"
                    class=${styling}>
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
                class="rw-facet-button"
                @click=${() => this.showFacets = !this.showFacets}>
                    ${this.showFacets ?
                html`<relewise-x-icon class="rw-icon"></relewise-x-icon>` :
                html`<relewise-filter-icon class="rw-icon"></relewise-filter-icon>`}
            </relewise-button>
            ${this.showFacets ?
                html`
                <div class="rw-facets-container">
                    ${this.facetResult?.items?.map((item, index) => {
                    return this.renderFacet(this.labels[index], item, this.showDimmingOverlay ? 'rw-dimmed' : '', index === (this.facetResult?.items?.length ?? 0) - 1);
                })}
                </div>
            ` : nothing}
        `;
    }

    static styles = [theme, css`
        .rw-facets-container {
            display: flex;
            flex-direction: column;
            gap: 1.5em;

            border: 1px solid var(--relewise-checklist-facet-border-color, #eee);
            background-color: var(--button-color, #f9f9f9);
            border-radius: 0.5em;
            box-shadow: 0 1px rgb(0 0 0 / 0.05);
            padding: 1em;
        }

        .rw-icon {
            --relewise-icon-color: black;
        }

        .rw-dimmed {
            opacity: .5;
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
