import { LitElement, css, html } from 'lit';
import { theme } from '../theme';

export class ProductSearch extends LitElement {
    
    async connectedCallback() {
        super.connectedCallback();
    }

    render() {
        return html`Relewise Product Search`;
    }

    static styles = [theme,css``];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-search': ProductSearch;
    }
}