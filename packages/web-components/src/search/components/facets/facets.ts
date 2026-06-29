import { RelewiseLitElement } from '../../../relewise-lit-element';
import { TemplateResult, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { FacetResult, FacetResultContainer } from '../../types';
import { Events, getRelewiseUISearchOptions } from '../../../helpers';
import { theme } from '../../../theme';

export class Facets extends RelewiseLitElement {

    @property({ type: Object, attribute: 'facets-result' })
    facetResult: FacetResultContainer | null | undefined = null;

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
        if (!this.shouldRenderFacet(facetResult)) {
            return nothing;
        }

        if (facetResult.$type.includes('PriceRangesFacetResult') ||
            facetResult.$type.includes('ProductDataDoubleRangesFacetResult') ||
            facetResult.$type.includes('ContentDataDoubleRangesFacetResult') ||
            facetResult.$type.includes('ProductCategoryDataDoubleRangesFacetResult')) {
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
            facetResult.$type.includes('ContentAssortmentFacetResult') ||
            facetResult.$type.includes('ProductCategoryAssortmentFacetResult') ||
            facetResult.$type.includes('ProductDataDoubleValueFacetResult') ||
            facetResult.$type.includes('ContentDataDoubleValueFacetResult') ||
            facetResult.$type.includes('ContentDataIntegerValueFacetResult') ||
            facetResult.$type.includes('ProductCategoryDataDoubleValueFacetResult')) {
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

        if (facetResult.$type.includes('ProductDataBooleanValueFacetResult') ||
            facetResult.$type.includes('ContentDataBooleanValueFacetResult') ||
            facetResult.$type.includes('ProductCategoryDataBooleanValueFacetResult')) {
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

        if (facetResult.$type.includes('ProductDataStringValueFacetResult') ||
            facetResult.$type.includes('ContentDataStringValueFacetResult') ||
            facetResult.$type.includes('ProductCategoryDataStringValueFacetResult')) {
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
            facetResult.$type.includes('ContentDataDoubleRangeFacetResult') ||
            facetResult.$type.includes('ProductCategoryDataDoubleRangeFacetResult') ||
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

    shouldRenderFacet(facetResult: FacetResult): boolean {
        if (!('available' in facetResult)) {
            return false;
        }

        if (Array.isArray(facetResult.available)) {
            return facetResult.available.length > 0;
        }

        return Boolean(facetResult.available?.value);
    }

    render() {
        const localization = getRelewiseUISearchOptions()?.localization?.facets;
        const visibleItems = this.facetResult?.items?.filter(item => this.shouldRenderFacet(item)) ?? [];

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
                ${visibleItems.length > 0 ? html`
                <div class="rw-facets-container">
                    ${visibleItems.map((item, index) => {
                    const originalIndex = this.facetResult?.items?.indexOf(item) ?? index;
                    return this.renderFacet(this.labels[originalIndex], item, this.showDimmingOverlay ? 'rw-dimmed' : '', index === visibleItems.length - 1);
                })}
                </div>
                ` : nothing}
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

        .rw-facet-button {
            --button-color: white;
            --relewise-button-border-color: var(--relewise-checklist-facet-border-color, #eee);
            --relewise-button-text-color: #333;
            --relewise-button-height: auto;
            --relewise-button-font-size: 0.9em;
            margin: 0 0 0.5em 0;
        }

        .rw-facet-button .rw-button {
            height: auto;
            padding: 0;
            background-color: white;
            border-color: var(--relewise-checklist-facet-border-color, #eee);
            color: #333;
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
