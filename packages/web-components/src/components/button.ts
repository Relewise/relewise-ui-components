import { RelewiseLitElement } from '../relewise-lit-element';
import { css, html, nothing } from 'lit';
import { theme } from '../theme';
import { property } from 'lit/decorators.js';

export class Button extends RelewiseLitElement {
    private lightDomChildren: ChildNode[] = [];

    @property({ attribute: 'button-text' })
    buttonText: string | null = null;

    @property()
    handleClick = () => { };

    connectedCallback(): void {
        super.connectedCallback();
    }

    protected createRenderRoot(): HTMLElement | DocumentFragment {
        const root = super.createRenderRoot();

        if (root === this && this.lightDomChildren.length === 0) {
            this.lightDomChildren = Array.from(this.childNodes);
        }

        return root;
    }

    render() {
        return html`
            <button class="rw-button rw-border" @click=${() => this.handleClick()}>  
                    ${this.renderButtonText()}
                    ${this.renderButtonIcon()}
            </button>
        `;
    }

    private renderButtonText() {
        if (this.buttonText) {
            return html`<span class="rw-button-text">${this.buttonText}</span>`;
        }

        if (window.relewiseUIOptions?.components?.domMode === 'light') {
            return html`<span class="rw-button-text">${this.lightDomChildren}</span>`;
        }

        return nothing;
    }

    private renderButtonIcon() {
        if (window.relewiseUIOptions?.components?.domMode === 'light') {
            return this.buttonText && this.lightDomChildren.length > 0 ? html`<span class="rw-button-icon">${this.lightDomChildren}</span>` : nothing;
        }

        return html`<span class="rw-button-icon"><slot slot="icon"></slot></span>`;
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
            height: inherit;
            width: inherit;
            color: white;
            display: flex;
            align-items: center;
            padding: inherit;

            font-weight: var(--relewise-button-text-font-weight, 600);
            border-color: var(--relewise-button-border-color, #eee);
            background-color: var(--button-color, white);
            color: var(--relewise-button-text-color, #333);
            border-radius: 0.5em;
            box-shadow: 0 1px rgb(0 0 0 / 0.05);
            font-size: 0.9em;
            justify-content: center;
        }

        .rw-button.rw-border {
            border-radius: 0.5em;
        }

        .rw-button-text {
            align-items: center;
            justify-content: center;
            display: flex;
            line-height: 1em;
            padding: .5em .25rem;
            width: 100%;
            text-align: left;  
            line-height: 1;    
        }

        .rw-button-icon {
            padding: var(--relewise-button-icon-padding, 0.3em .8em);
            --relewise-icon-color: white;
            line-height: 1;
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-button': Button;
    }
}
