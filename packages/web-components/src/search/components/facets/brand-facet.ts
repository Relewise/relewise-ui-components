import { BrandFacetResult } from '@relewise/client';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { brandFacetQueryName, categoryFacetQueryName, readCurrentUrlStateValues } from '../../../helpers';
import { FacetBase } from './facet-base';

export class BrandFacet extends FacetBase {

    @property({ attribute: 'label-text' })
    labelText: string = 'Brands';
    
    connectedCallback(): void {
        super.connectedCallback();
        this.selectedValues = readCurrentUrlStateValues(categoryFacetQueryName);
    }

    render() {
        const brandFacet = this.searchResult?.facets?.items?.find(x => x.field === 'Brand') as BrandFacetResult;
        
        if (!brandFacet ||
            !brandFacet.available ||
            brandFacet.available.length < 1) {
            return;
        }

        const brandsToShow = this.showAll
            ? brandFacet.available
            : brandFacet.available.slice(0, 10);

        return html`
        <div class="rw-facet-content">
            <h3>${this.labelText}</h3>
            ${brandsToShow.map((item, index) => {
                    return html`
                    ${item.value && item.value.displayName ? html`
                        <div>
                            <input
                                type="checkbox"
                                id=${index}
                                name=${index}
                                ?checked=${this.selectedValues.filter(x => x === item.value?.id).length > 0}
                                @change=${(e: Event) => this.handleChange(e, item, brandFacetQueryName)} />
                            <label for=${index}>${item.value?.displayName}</label>
                        </div>
                    ` : nothing}
                    `;
                })}
            ${brandFacet.available.length > 11 ? html`
                ${this.showAll ? html`
                    <relewise-button
                        button-text="Show Less"
                        class="rw-show-more"
                        @click=${() => this.showAll = false}>
                    </relewise-button>` : html`
                    <relewise-button
                        button-text="Show More"
                        class="rw-show-more"
                        @click=${() => this.showAll = true}>
                    </relewise-button>`}    
                ` : nothing}
        </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-brand-facet': BrandFacet;
    }
}