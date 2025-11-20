import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { idPathAsArray } from '../../helpers/idPathValidator';
import { getRelewiseUIOptions } from '../../helpers/relewiseUIOptions';
import { getTracker } from '../tracker';

export class ContentCategoryView extends LitElement {

    @property({ attribute: 'id-path' })
    idPath: string | null = null;

    async connectedCallback() {
        super.connectedCallback();

        const pathAsArray = idPathAsArray(this.idPath);
        if (!pathAsArray) return;

        const options = getRelewiseUIOptions();
        const tracker = getTracker(options);
        const user = await options.contextSettings.getUser();

        tracker.trackContentCategoryView({
            idPath: pathAsArray,
            user: user,
        });
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-track-content-category-view': ContentCategoryView;
    }
}