import { LitElement, css, html } from 'lit';
import { theme } from '../theme';

export class LoadingSpinner extends LitElement {
    render() {
        return html`<div class="loader"></div>`;
    }

    static styles = [theme, css`
    .loader {
        border: 16px solid var(--color);
        border-top: 16px solid;
        border-radius: 50%;
        border-top-color: var(--accent-color);
        width: 120px;
        height: 120px;
        animation: spin 2s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }`];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-loading-spinner': LoadingSpinner;
    }
}