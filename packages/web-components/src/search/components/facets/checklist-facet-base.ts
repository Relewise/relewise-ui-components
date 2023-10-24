import { BooleanAvailableFacetValue, BrandFacetResult, BrandNameAndIdResultAvailableFacetValue, CategoryFacetResult, Int32AvailableFacetValue, ProductAssortmentFacetResult, ProductDataBooleanValueFacetResult, ProductDataStringValueFacetResult, StringAvailableFacetValue } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events, readCurrentUrlStateValues, updateUrlStateValues } from '../../../helpers';
import { theme } from '../../../theme';

export abstract class ChecklistFacetBase extends LitElement {


    abstract handleChange(e: Event, item: BrandNameAndIdResultAvailableFacetValue | StringAvailableFacetValue | BooleanAvailableFacetValue | Int32AvailableFacetValue): void;
    
    abstract getOptionDisplayValue(item: BrandNameAndIdResultAvailableFacetValue | StringAvailableFacetValue | BooleanAvailableFacetValue | Int32AvailableFacetValue): string;

    abstract shouldOptionBeChecked(item: BrandNameAndIdResultAvailableFacetValue | StringAvailableFacetValue | BooleanAvailableFacetValue | Int32AvailableFacetValue): boolean;

    @property({ type: Object })
    result: (BrandFacetResult | CategoryFacetResult | ProductDataStringValueFacetResult | ProductDataBooleanValueFacetResult | ProductAssortmentFacetResult) | null = null;

    @state()
    selectedValues: string[] = [];

    @state()
    showAll: boolean = false;

    connectedCallback(): void {
        super.connectedCallback();
        if (this.result) {
            if ('key' in this.result)  {
                this.selectedValues = readCurrentUrlStateValues(this.result.field + this.result.key);
            } else {
                this.selectedValues = readCurrentUrlStateValues(this.result.field);
            }
        }
    }

    getLabelDisplayValue(): string {
        if (!this.result) {
            return '';
        }  

        if ('key' in this.result && this.result.key) {
            return this.result.key;
        }

        return this.result.field;
    }

    updateUrlState() {
        if (!this.result) {
            return;
        }  

        if ('key' in this.result) {
            updateUrlStateValues(this.result.field + this.result.key, this.selectedValues);
        } else {
            updateUrlStateValues(this.result.field, this.selectedValues);
        }

        window.dispatchEvent(new CustomEvent(Events.shouldClearSearchResult));
        window.dispatchEvent(new CustomEvent(Events.shouldPerformSearch));
    }

    render() {
        console.log(this.result);
        if (!this.result || !this.result.available || this.result?.available.length < 1) {
            return;
        }

        const facetResultsToShow = this.showAll
            ? this.result.available
            : this.result.available.slice(0, 10);

        return html`
        <div class="rw-facet-content">
            <h3>${this.getLabelDisplayValue()}</h3>
            ${facetResultsToShow.map((item, index) => {
                    return html`
                    ${item.value !== undefined ? html`
                        <div>
                            <input
                                type="checkbox"
                                id=${index}
                                name=${index}
                                ?checked=${this.shouldOptionBeChecked(item)}
                                @change=${(e: Event) => this.handleChange(e, item)} />
                            <label for=${index}>${this.getOptionDisplayValue(item)}</label>
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