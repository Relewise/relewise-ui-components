import { ProductSearchResponse } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events, updateUrlStateValues } from '../../../helpers';
import { theme } from '../../../theme';
import { FacetResult } from './facet-result';

export abstract class ChecklistFacetBase extends LitElement {

    @property({ type: Object, attribute: 'search-result' })
    searchResult: ProductSearchResponse | null = null;

    @state()
    selectedValues: string[] = [];

    @state()
    showAll: boolean = false;

    @property({ attribute: 'label-text' })
    labelText: string = 'Label';

    abstract getFacetResults(): FacetResult[];

    abstract facetQueryName: string;

    handleChange(e: Event, item: FacetResult, facetQueryName: string) {
        const checkbox = e.target as HTMLInputElement;
        
        if (!item.displayName || !item.id)  {
            return;
        }

        if (checkbox.checked) {
            this.selectedValues.push(item.id);
        } else {
            const newValue =  this.selectedValues.filter(x => x !== item.id);
            this.selectedValues = newValue;
        }

        updateUrlStateValues(facetQueryName, this.selectedValues);
        window.dispatchEvent(new CustomEvent(Events.shouldClearSearchResult));
        window.dispatchEvent(new CustomEvent(Events.shouldPerformSearch));
    }

    render() {
        const facetResults = this.getFacetResults();
        
        if (facetResults.length < 1) {
            return;
        }

        const facetResultsToShow = this.showAll
            ? facetResults
            : facetResults.slice(0, 10);

        return html`
        <div class="rw-facet-content">
            <h3>${this.labelText}</h3>
            ${facetResultsToShow.map((item, index) => {
                    return html`
                    ${item.id && item.displayName ? html`
                        <div>
                            <input
                                type="checkbox"
                                id=${index}
                                name=${index}
                                ?checked=${this.selectedValues.filter(x => x === item.id).length > 0}
                                @change=${(e: Event) => this.handleChange(e, item, this.facetQueryName)} />
                            <label for=${index}>${item.displayName}</label>
                        </div>
                    ` : nothing}
                    `;
                })}
            ${facetResults.length > 10 ? html`
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