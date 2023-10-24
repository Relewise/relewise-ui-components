import { ProductDataDoubleRangeFacetResult } from '@relewise/client';
import { LitElement, css, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events, readCurrentUrlState, updateUrlState } from '../../../helpers';
import { theme } from '../../../theme';

export class NumberRangeFacet extends LitElement {

    @property({ type: Object })
    result: (ProductDataDoubleRangeFacetResult) | null = null;

    @state()
    upperBound: number | null | undefined = null;

    @state()
    lowerBound: number | null | undefined = null;

    connectedCallback(): void {
        super.connectedCallback();
        if (this.result) {

            let upperBound = null;
            let lowerBound = null;
            
            if ('key' in this.result) {
                upperBound = readCurrentUrlState(this.result.field + this.result.key + 'upperbound');
                lowerBound = readCurrentUrlState(this.result.field + this.result.key + 'lowerbound');
                
            } else {
                upperBound = readCurrentUrlState(this.result.field + 'upperbound');
                lowerBound = readCurrentUrlState(this.result.field + 'lowerbound');
            }
            
            if (upperBound && !isNaN(+upperBound)) {
                this.upperBound = +upperBound;
            }

            if (lowerBound && !isNaN(+lowerBound)) {
                this.lowerBound = +lowerBound;
            }

            if (!this.upperBound && this.result.available && this.result.available.value) {
                this.upperBound = this.result.available.value.upperBoundInclusive;
            }

            if (!this.lowerBound && this.result.available && this.result.available.value) {
                this.lowerBound = this.result.available.value.lowerBoundInclusive;
            }
        }
    }

    handleLowerBoundChange(event: Event) {
        const inputElement = event.target as HTMLInputElement;
        const lowerBoundValue = inputElement.value;

        if (!this.result || isNaN(+lowerBoundValue)) {
            return;
        }
        
        if (this.upperBound && +lowerBoundValue > this.upperBound) {
            return;
        }

        this.lowerBound = +lowerBoundValue;
    }
      
    handleUpperBoundChange(event: Event) {
        const inputElement = event.target as HTMLInputElement;
        const upperBoundValue = inputElement.value;
       
        if (!this.result || isNaN(+upperBoundValue)) {
            return;
        }
        if (this.lowerBound && +upperBoundValue < this.lowerBound) {
            return;
        }

        this.upperBound = +upperBoundValue;
    }

    apply() {
        if (!this.result || !this.lowerBound || !this.upperBound) {
            return;
        }

        if ('key' in this.result) {
            updateUrlState(this.result.field + this.result.key + 'upperbound', this.upperBound.toString());
            updateUrlState(this.result.field + this.result.key + 'lowerbound', this.lowerBound.toString());
        } else {
            updateUrlState(this.result.field + 'upperbound', this.upperBound.toString());
            updateUrlState(this.result.field + 'lowerbound', this.lowerBound.toString());
        }
        
        window.dispatchEvent(new CustomEvent(Events.shouldClearSearchResult));
        window.dispatchEvent(new CustomEvent(Events.shouldPerformSearch));
    }


    render() {
        if (!this.result?.available || !this.result.available.value) {
            return;
        }

        return html`
        <div class="rw-facet-content">
            <input
                type="number"
                .value=${this.lowerBound?.toString() ?? ''}
                @input=${this.handleLowerBoundChange}>
                    <span>-</span>
            <input
                type="number"
                .value=${this.upperBound?.toString() ?? ''}
                @input=${this.handleUpperBoundChange}>
            <relewise-button class="rw-button" @click=${this.apply}>Apply</relewise-button>
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
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-number-range-facet': NumberRangeFacet;
    }
}