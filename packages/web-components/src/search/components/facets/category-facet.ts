import { LitElement, css, html } from 'lit';
import { state } from 'lit/decorators.js';
import { theme } from '../../../theme';

export class CategoryFacet extends LitElement {

    @state()
    term: string = '';

    connectedCallback(): void {
        super.connectedCallback();
    }

    render() {
        return html`<h1>Category Facet</h1>`;
    }

    static styles = [theme, css``];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-category-facet': CategoryFacet;
    }
}