import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { theme } from '../../../theme';
import { ProductFacetResult } from '@relewise/client';

export class Facets extends LitElement {

    @property({ type: Object, attribute: 'facets-result' })
    facetResult: ProductFacetResult | null | undefined = null;

    @state()
    showFacets: boolean = window.innerWidth >= 1024;
    
    render() {
        console.log('test');
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
                        if (item.$type.includes('BrandFacetResult') || item.$type.includes('CategoryFacetResult')) {
                            return html`
                                <relewise-checklist-facet .result=${item}>
                                </relewise-checklist-facet>
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