import { LitElement, css, html, nothing } from 'lit';
import { theme } from '../theme';
import { property } from 'lit/decorators.js';

export class Button extends LitElement {

    @property({ attribute: 'button-text' })
    buttonText: string | null = null;

    @property()
    handleClick = () => { };

    connectedCallback(): void {
        super.connectedCallback();
    }

    render() {
        return html`
            <button class="rw-button" @click=${() => this.handleClick()}>  
                    ${this.buttonText ? html`
                        <span class="rw-button-text">${this.buttonText}</span>
                    ` : nothing}
                    <span class="rw-button-icon"><slot name="icon"></slot></span>
            </button>
        `;
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

            font-weight: var(--relewise-button-text-font-weight, 600);
            border: 1px solid var(--relewise-checklist-facet-border-color, #eee);
            background-color: var(--button-color, white);
            color: var(--relewise-button-text-color, #333);
            border-radius: 0.5em;
            box-shadow: 0 1px rgb(0 0 0 / 0.05);
            font-size: 0.9em;
            justify-content: center;
        }

        .rw-button-text {
            align-items: center;
            justify-content: center;
            display: flex;
            line-height: 1em;
            padding: .25em;
            width: 100%;
            text-align: left;  
            line-height: 1;    
        }
        
        .rw-button-icon {
            padding: var(--relewise-button-icon-padding, 0.3em .8em);
            --relewise-icon-color: white;
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-button': Button;
    }
}