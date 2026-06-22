import { LitElement } from 'lit';

export type RelewiseRenderRoot = 'shadow' | 'light';

export interface RelewiseWebComponentsOptions {
    renderRoot?: RelewiseRenderRoot;
}

export class RelewiseLitElement extends LitElement {
    protected createRenderRoot(): HTMLElement | DocumentFragment {
        if (window.relewiseUIOptions?.webComponents?.renderRoot === 'light') {
            return this;
        }

        return super.createRenderRoot();
    }
}
