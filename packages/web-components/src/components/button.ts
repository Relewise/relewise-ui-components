import { LitElement, css, html } from 'lit';
import { theme } from '../theme';
import { property } from 'lit/decorators.js';

export class Button extends LitElement {

    @property({ attribute: 'button-text' })
    buttonText: string | null = null;

    @property()
    handleClick = () => {};

    connectedCallback(): void {
        super.connectedCallback();
    }

    render() {
      
        return html`
        <button class="rw-button" @click=${() => this.handleClick()}>
            <span class="rw-button-text">${this.buttonText}</span>
            <span class="rw-button-icon"><slot slot="icon"></slot></span>
        </button>`;
    }

    static styles = [theme, css`
        .rw-button {
            display: flex;
            height: 3.25rem;
            align-items: center;
            color: white;
            border: 2px solid;
            border-color: var(--accent-color);
            border-radius: 1rem;
            background-color: var(--accent-color);
            cursor: pointer;
        }

        .rw-button-text {
            padding: .5rem;
        }
        
        .rw-button-icon {
            padding: .5rem;
            --relewise-search-icon-color: white;
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-button': Button;
    }
}