import { LitElement, css, html } from 'lit';

/**
 * Icon is sourced from: https://iconmonstr.com/heart-filled-svg/
 */
export class HeartFilledIcon extends LitElement {

    connectedCallback(): void {
        super.connectedCallback();
    }

    render() {
        return html`
        <svg id="svg-icon" clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="m12 5.72c-2.624-4.517-10-3.198-10 2.461 0 3.725 4.345 7.727 9.303 12.54.194.189.446.283.697.283s.503-.094.697-.283c4.977-4.831 9.303-8.814 9.303-12.54 0-5.678-7.396-6.944-10-2.461z" fill-rule="nonzero"/>
        </svg>`;
    }

    static styles = css`
        :host {
            width: var(--relewise-icon-width, 1rem);
            height: var(--relewise-icon-height, 1rem);
        }
        #svg-icon {
            width: var(--relewise-icon-width, 1rem);
            height: var(--relewise-icon-height, 1rem);
        }
    `;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-heart-filled-icon': HeartFilledIcon;
    }
}