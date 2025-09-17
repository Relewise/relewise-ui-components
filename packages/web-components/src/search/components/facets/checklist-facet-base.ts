import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events, QueryKeys, getRelewiseUISearchOptions, readCurrentUrlStateValues, updateUrlStateValues } from '../../../helpers';
import { theme } from '../../../theme';
import { CheckListFacet, CheckListFacetValue } from '../../types';

export abstract class ChecklistFacetBase extends LitElement {

    abstract handleChange(e: Event, item: CheckListFacetValue): void;

    abstract getOptionDisplayValue(item: CheckListFacetValue): string;

    abstract shouldOptionBeChecked(item: CheckListFacetValue): boolean;

    @property({ type: Object })
    result: CheckListFacet | null = null;

    @property()
    label: string = '';

    @state()
    selectedValues: string[] = [];

    @state()
    showAll: boolean = false;

    clearSelectedValuesBound = this.clearSelectedValues.bind(this);

    connectedCallback(): void {
        super.connectedCallback();
        window.addEventListener(Events.search, this.clearSelectedValuesBound);

        if (this.result) {
            if ('key' in this.result) {
                this.selectedValues = readCurrentUrlStateValues(QueryKeys.facet + this.result.field + this.result.key);
            } else {
                this.selectedValues = readCurrentUrlStateValues(QueryKeys.facet + this.result.field);
            }
        }
    }

    disconnectedCallback() {
        window.removeEventListener(Events.search, this.clearSelectedValuesBound);
        super.disconnectedCallback();
    }

    clearSelectedValues() {
        this.selectedValues = [];
        this.updateUrlState();
    }

    updateUrlState(searchForProducts: boolean = false) {
        if (!this.result) {
            return;
        }

        if ('key' in this.result) {
            updateUrlStateValues(QueryKeys.facet + this.result.field + this.result.key, this.selectedValues);
        } else {
            updateUrlStateValues(QueryKeys.facet + this.result.field, this.selectedValues);
        }

        if (searchForProducts) {
            window.dispatchEvent(new CustomEvent(Events.applyFacet));
        }
    }

    render() {
        if (!this.result || !this.result.available || this.result?.available.length < 1) {
            return;
        }

        const localization = getRelewiseUISearchOptions()?.localization?.facets;

        const facetResultsToShow = this.showAll
            ? this.result.available
            : this.result.available.sort((a, b) => {
                if (a.selected && !b.selected) {
                    return -1; // a comes before b
                } else if (!a.selected && b.selected) {
                    return 1; // b comes before a
                } else {
                    return 0; // leave their order unchanged
                }
            }).slice(0, 10);

        // if there are not facets options, then return nothing
        if (facetResultsToShow.length === 0) {
            this.toggleAttribute('hidden', true);
            return nothing;
        }


        return html`
        <div class="rw-facet-content">
            <h3 part="title">${this.label}</h3>
            ${facetResultsToShow.map((item, index) => {
            return html`
                    ${item.value !== undefined ? html`
                        <div>
                            <label class="rw-label" part="label" for=${`${this.result?.field}-${this.result?.$type}-${index}`}>
                                <input
                                    type="checkbox"
                                    part="input"
                                    id=${`${this.result?.field}-${this.result?.$type}-${index}`}
                                    name=${`${this.result?.field}-${this.result?.$type}-${index}`}
                                    .checked=${this.shouldOptionBeChecked(item)}
                                    @click=${(e: Event) => {
                        e.preventDefault();
                        this.handleChange(e, item);
                    }} />
                                <span part="value">${this.getOptionDisplayValue(item)}</span>
                                <span class="rw-hits" part="hits">(${item.hits})</span>
                            </label>
                        </div>
                    ` : nothing}
                        `;
        })}
            ${this.result.available.length > 10 ? html`
                ${this.showAll ? html`
                    <relewise-button
                        class="rw-show-more"
                        @click=${() => this.showAll = false}>
                        <span>${localization?.showLess ?? 'Show Less'}</span>
                    </relewise-button>` : html`
                    <relewise-button
                        class="rw-show-more"
                        @click=${() => this.showAll = true}>
                        <span>${localization?.showMore ?? 'Show More'}</span>
                    </relewise-button>`}    
                ` : nothing}
    </div>
        `;
    }

    static styles = [theme, css`
        :host {
            font-family: var(--font);
            height: fit-content;

            border-bottom: 1px solid;
            border-color: var(--relewise-checklist-facet-border-color, #eee);
            padding-bottom: 1.5rem;
        }

        .rw-label {
            cursor: pointer;
            display: flex;
            gap: 0.3rem;
            align-items: center;
            word-break: break-all;
            margin-top: .25rem;
            margin-bottom: .25rem;
        }

        .rw-label input {
            cursor: pointer;
            margin-left: 0;
            width: 1rem;
            height: 1rem;
            accent-color: var(--accent-color);
        }

        .rw-show-more {
            margin: 0px;
        }

        .rw-hits {
            color: var(--relewise-checklist-facet-hits-color, gray);
            font-size: var(--relewise-checklist-facet-hits-font-size, .85rem);
        }

        h3 {
            margin-top: 0;
            margin-bottom: 0.5rem;
            font-weight: 500;
            font-size: 1rem;
        }
    `];
}