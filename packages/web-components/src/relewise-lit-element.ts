import { LitElement } from 'lit';

export type RelewiseDomMode = 'shadow' | 'light';

export interface RelewiseComponentsOptions {
    domMode?: RelewiseDomMode;
}

export class RelewiseLitElement extends LitElement {
    protected createRenderRoot(): HTMLElement | DocumentFragment {
        if (window.relewiseUIOptions?.components?.domMode === 'light') {
            return this;
        }

        return super.createRenderRoot();
    }
}
