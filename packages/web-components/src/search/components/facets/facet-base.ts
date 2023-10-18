import { CategoryNameAndIdResultAvailableFacetValue, ProductSearchResponse } from '@relewise/client';
import { LitElement, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events, updateUrlStateValues } from '../../../helpers';
import { theme } from '../../../theme';

export abstract class FacetBase extends LitElement {

    @property({ type: Object, attribute: 'search-result' })
    searchResult: ProductSearchResponse | null = null;

    @state()
    selectedValues: string[] = [];

    @state()
    showAll: boolean = false;

    handleChange(e: Event, item: CategoryNameAndIdResultAvailableFacetValue, facetQueryName: string) {
        const checkbox = e.target as HTMLInputElement;
        
        if (!item.value || !item.value.id)  {
            return;
        }

        if (checkbox.checked) {
            this.selectedValues.push(item.value.id);
        } else {
            const newValue =  this.selectedValues.filter(x => x !== item.value?.id);
            this.selectedValues = newValue;
        }

        updateUrlStateValues(facetQueryName, this.selectedValues);
        window.dispatchEvent(new CustomEvent(Events.shouldClearSearchResult));
        window.dispatchEvent(new CustomEvent(Events.shouldPerformSearch));
    }

    static styles = [theme, css`
        :host {
            border: 1px solid;
            border-radius: 1rem;
            border-color: lightgray;
            background-color: lightgray;
            height: fit-content;
            width: 12rem;
        }

        .rw-show-more {
            --relewise-button-text-color: black;
        }
    `];
}