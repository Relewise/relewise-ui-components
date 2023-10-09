import { LitElement, css, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { theme } from '../theme';

export class ProductSearch extends LitElement {

    @property({ attribute: 'search-bar-placeholder' })
    searchBarPlaceholder: string | null = null;
    
    @state()
    term: string = '';

    async connectedCallback() {
        super.connectedCallback();
    }

    render() {
        return html`
        <relewise-search-bar 
                .term=${this.term}
                .setSearchTerm=${(term: string)=> this.term = term}
                .placeholder=${this.searchBarPlaceholder}
                ></relewise-search-bar>
        <div>${this.term}</div>
        `;
    }

    static styles = [theme,css``];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-search': ProductSearch;
    }
}