import { LitElement, css, html, nothing } from 'lit';
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
            ${this.buttonText ? html`
                <span class="rw-button-text">${this.buttonText}</span>
            ` : nothing}
            <span class="rw-button-icon"><slot slot="icon"></slot></span>
        </button>`;
    }

    static styles = [theme, css`
        :host {
            font-family: var(--font);
            cursor: pointer;
            display: block;
            width: fit-content;
            height: fit-content;
            margin: auto;
        }
        
        .rw-button {
            cursor: pointer;
            background-color: inherit;
            border: inherit;
            border-radius: inherit;
            border-color: inherit;
            height: inherit;
            width: inherit;
            color: white;
            display: flex;
            align-items: center;
            padding: inherit;
        }

        .rw-button-text {
            padding: .5rem;
            color: var(--relewise-button-text-color, white);
            font-weight: var(--relewise-button-text-font-weight, 100);
        }
        
        .rw-button-icon {
            padding: .5rem;
            --relewise-icon-color: white;
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-button': Button;
    }
}