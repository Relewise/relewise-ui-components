import { LitElement } from 'lit';
import { registerLightDomStyles } from './lightDomStyles';

export class RelewiseLitElement extends LitElement {
    protected createRenderRoot(): HTMLElement | DocumentFragment {
        if (window.relewiseUIOptions?.components?.domMode === 'light') {
            this.registerLightDomStyles();
            return this;
        }

        return super.createRenderRoot();
    }

    protected registerLightDomStyles(styles = (this.constructor as typeof RelewiseLitElement).styles) {
        if (window.relewiseUIOptions?.components?.styling === 'none') {
            return;
        }

        registerLightDomStyles(this.localName, styles);
    }
}
