import { BrandFacetResult, CategoryFacetResult, StringBrandNameAndIdResultValueFacetResult, StringCategoryNameAndIdResultValueFacetResult } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events, updateUrlStateValues } from '../../../helpers';
import { theme } from '../../../theme';

export class ChecklistFacet extends LitElement {

    @property({ type: Object })
    result: (BrandFacetResult | CategoryFacetResult) | null = null;

    @state()
    selectedValues: string[] = [];

    @state()
    showAll: boolean = false;

    @property({ attribute: 'label-text' })
    labelText: string = 'Label';

    handleChange(e: Event, id: string) {
        const checkbox = e.target as HTMLInputElement;
        
        if (!id || !this.result)  {
            return;
        }

        if (checkbox.checked) {
            this.selectedValues.push(id);
        } else {
            const newValue =  this.selectedValues.filter(x => x !== id);
            this.selectedValues = newValue;
        }

        updateUrlStateValues(this.result?.$type, this.selectedValues);
        window.dispatchEvent(new CustomEvent(Events.shouldClearSearchResult));
        window.dispatchEvent(new CustomEvent(Events.shouldPerformSearch));
    }

    render() {

        if (!this.result || !this.result.available || this.result?.available.length < 1) {
            return;
        }

        const facetResultsToShow = this.showAll
            ? this.result.available
            : this.result.available.slice(0, 10);

        return html`
        <div class="rw-facet-content">
            <h3>${this.labelText}</h3>
            ${facetResultsToShow.map((item, index) => {
                    return html`
                    ${item.value && item.value.id ? html`
                        <div>
                            <input
                                type="checkbox"
                                id=${index}
                                name=${index}
                                ?checked=${this.selectedValues.filter(x => x === item.value!.id).length > 0}
                                @change=${(e: Event) => this.handleChange(e, item.value!.id ?? '')} />
                            <label for=${index}>${item.value.displayName}</label>
                        </div>
                    ` : nothing}
                    `;
                })}
            ${this.result.available.length > 10 ? html`
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

    static styles = [theme, css`
        :host {
            border: 1px solid;
            border-radius: 1rem;
            border-color: lightgray;
            background-color: lightgray;
            height: fit-content;
            width: fit-content;            
        }

        .rw-facet-content {
            margin: .5rem;
        }

        .rw-show-more {
            --relewise-button-text-color: black;
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-checklist-facet': ChecklistFacet;
    }
}