import { ProductDataDoubleRangeFacetResult } from '@relewise/client';
import { LitElement, css, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events, readCurrentUrlState, updateUrlState } from '../../../helpers';
import { theme } from '../../../theme';

export class NumberRangeFacet extends LitElement {

    @property({ type: Object })
    result: (ProductDataDoubleRangeFacetResult) | null = null;

    @property({ attribute: 'save-selected-number-range-text'})
    saveSelectedRangeText: string = 'Save';

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

    save() {
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
        
        window.dispatchEvent(new CustomEvent(Events.search));
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

    handleKeyEvent(event: KeyboardEvent): void {
        switch (event.key) {
        case 'Enter':
            event.preventDefault();
            this.save();
            break;
        }
    }

    render() {
        if (!this.result?.available ||
            !this.result.available.value ||
            !this.result.available.value.lowerBoundInclusive || 
            !this.result.available.value.upperBoundInclusive) {
            return;
        }
        return html`
        <div class="rw-facet-content">
            <h3>${this.getLabelDisplayValue()}</h3>
            <div class="rw-flex">
                <div class="rw-input-container">
                    <input
                    type="number"
                        .value=${this.lowerBound?.toString() ?? ''}
                        @input=${this.handleLowerBoundChange}
                        class="rw-input"
                        @keydown=${this.handleKeyEvent}>
                </div>
                        <span class="rw-range-delimiter">-</span>
                <div class="rw-input-container">
                    <input
                        type="number"
                        .value=${this.upperBound?.toString() ?? ''}
                        @input=${this.handleUpperBoundChange}
                        class="rw-input"
                        @keydown=${this.handleKeyEvent}>
                </div>
                <relewise-button class="rw-button rw-save" @click=${this.save}>${this.saveSelectedRangeText}</relewise-button>
            </div>
        </div>
      `;
    }

    static styles = [theme, css`
        :host {
            border-radius: 1rem;
            background-color: lightgray;
            height: fit-content;
        }

        .rw-facet-content {
            margin: .5rem;
        }

        .rw-save {
            height: 2rem;
            margin-left: .5rem;
        }

        .rw-input {
            all: unset;
            width: inherit;
        }

        .rw-input-container {
            display: flex;
            align-items: center;
            padding-left: 1rem;
            padding-right: 1rem;
            border: var(--relewise-number-range-input-border, 2px solid);
            border-color: var(--color);
            border-radius: var(--relewise-number-range-input-border-radius, 1rem);
            background: white;
            height: var(--relewise-number-range-input-height, 2rem);  
            width: var(--relewise-number-range-input-width, 4rem);  
        }

        .rw-range-delimiter {
            margin-left: .25rem;
            margin-right: .25rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .rw-input-container:focus-within {
            border-color: var(--accent-color);
        }

        .rw-flex {
            display: flex;
            height: 2rem;
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-number-range-facet': NumberRangeFacet;
    }
}