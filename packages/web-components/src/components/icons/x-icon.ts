import { LitElement, css, html } from 'lit';

export class XIcon extends LitElement {

    connectedCallback(): void {
        super.connectedCallback();
    }

    render() {
        return html`
        <svg id="svg-icon" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="122.879px" height="119.799px" viewBox="0 0 122.879 119.799" enable-background="new 0 0 122.879 119.799" xml:space="preserve">
            <g>
                <path d="M1.426,8.313c-1.901-1.901-1.901-4.984,0-6.886c1.901-1.902,4.984-1.902,6.886,0l53.127,53.127l53.127-53.127 c1.901-1.902,4.984-1.902,6.887,0c1.901,1.901,1.901,4.985,0,6.886L68.324,61.439l53.128,53.128c1.901,1.901,1.901,4.984,0,6.886 c-1.902,1.902-4.985,1.902-6.887,0L61.438,68.326L8.312,121.453c-1.901,1.902-4.984,1.902-6.886,0 c-1.901-1.901-1.901-4.984,0-6.886l53.127-53.128L1.426,8.313L1.426,8.313z"/>
            </g>
        </svg>
        `;
    }

    static styles = css`
        #svg-icon {
            width: 1rem;
            height: 1rem;
            fill: var(--relewise-icon-color);
        }
    `;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-x-icon': XIcon;
    }
}