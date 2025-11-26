import { LitElement, css, html } from 'lit';

export class ArrowUpIcon extends LitElement {

    connectedCallback(): void {
        super.connectedCallback();
    }

    render() {
        return html`
        <svg id="svg-icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.343 15.657L15.657 4.343m0 0v9.9m0-9.9h-9.9"/>
        </svg>
        `;
    }

    static styles = css`
        :host {
            line-height: 1;
            width: var(--relewise-icon-width, 1em);
            height: var(--relewise-icon-height, 1em);
        }
        #svg-icon {
            width: var(--relewise-icon-width, 1em);
            height: var(--relewise-icon-height, 1em);
            fill: var(--relewise-icon-color);

            path {
                stroke: var(--relewise-icon-color);
            }
        }
    `;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-arrow-up-icon': ArrowUpIcon;
    }
}