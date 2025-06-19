import { ProductDataDoubleRangeFacetResult } from '@relewise/client';
import { LitElement, css, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events, QueryKeys, getRelewiseUISearchOptions, readCurrentUrlState, updateUrlState } from '../../../helpers';
import { theme } from '../../../theme';

export class NumberRangeFacet extends LitElement {

    @property({ type: Object })
    result: (ProductDataDoubleRangeFacetResult) | null = null;

    @property()
    label: string = '';

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
                upperBound = readCurrentUrlState(QueryKeys.facetUpperbound + this.result.field + this.result.key);
                lowerBound = readCurrentUrlState(QueryKeys.facetLowerbound + this.result.field + this.result.key);
            } else {
                upperBound = readCurrentUrlState(QueryKeys.facetUpperbound + this.result.field);
                lowerBound = readCurrentUrlState(QueryKeys.facetLowerbound + this.result.field);
            }
            if (upperBound && !isNaN(+upperBound)) {
                this.upperBound = +upperBound;
            }

            if (lowerBound && !isNaN(+lowerBound)) {
                this.lowerBound = +lowerBound;
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
        if (!this.result) {
            return;
        }

        const upperBound = this.upperBound;
        if (!upperBound) {
            this.result.available?.value?.upperBoundInclusive;
        }

        const lowerBound = this.lowerBound;
        if (!lowerBound) {
            this.result.available?.value?.lowerBoundInclusive;
        }

        if ('key' in this.result) {
            updateUrlState(QueryKeys.facetUpperbound + this.result.field + this.result.key, upperBound?.toString() ?? '');
            updateUrlState(QueryKeys.facetLowerbound + this.result.field + this.result.key, lowerBound?.toString() ?? '');
        } else {
            updateUrlState(QueryKeys.facetUpperbound + this.result.field, upperBound?.toString() ?? '');
            updateUrlState(QueryKeys.facetLowerbound + this.result.field, lowerBound?.toString() ?? '');
        }

        window.dispatchEvent(new CustomEvent(Events.applyFacet));
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

        const localization = getRelewiseUISearchOptions()?.localization?.facets;
        return html`
        <div class="rw-facet-content">
            <h3>${this.label}</h3>
            <div class="rw-flex">
                <div class="rw-input-container rw-border">
                    <input
                    type="number"
                        .value=${this.lowerBound?.toString() ?? this.result.available.value.lowerBoundInclusive.toString()}
                        @input=${this.handleLowerBoundChange}
                        class="rw-input"
                        @keydown=${this.handleKeyEvent}>
                </div>
                        <span class="rw-range-delimiter">-</span>
                <div class="rw-input-container rw-border">
                    <input
                        type="number"
                        .value=${this.upperBound?.toString() ?? this.result.available.value.upperBoundInclusive.toString()}
                        @input=${this.handleUpperBoundChange}
                        class="rw-input"
                        @keydown=${this.handleKeyEvent}>
                </div>
                <relewise-button class="rw-save" @click=${this.save}>
                    <span class="rw-save-text">${localization?.save ?? 'Save'}</span>
                </relewise-button>
            </div>
        </div>
      `;
    }

    static styles = [theme, css`
        :host {
            font-family: var(--font);
            border-radius: var(--border-radius);
            background-color: var(--color);
            height: fit-content;
        }

        .rw-facet-content {
            margin: 1rem;
        }

        .rw-save {
            height: 2rem;
            margin-left: .5rem;
            border: var(--border);
            border-radius: var(--border-radius);
            border-color: lightgray;
            background-color: lightgray
        }

        .rw-save-text {
            font-size: 1rem;
            font-family: var(--font);
            color: var(--relewise-number-range-save-text-color, black);
            display: flex;
            justify-content: center;
            align-items: center;
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
            background: white;
            border-color: var(--color);
            height: var(--relewise-number-range-input-height, 2rem);  
            width: var(--relewise-number-range-input-width, 100%);  
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