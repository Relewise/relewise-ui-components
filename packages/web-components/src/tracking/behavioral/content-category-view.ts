import { UserFactory } from '@relewise/client';
import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { getTracker } from '../tracker';
import { getRelewiseUIOptions } from '../../helpers/relewiseUIOptions';
import { validateIdPath } from '../../helpers/idPathValidator';

export class ContentCategoryView extends LitElement {

    @property({ attribute: 'id-path' })
    idPath: string | null = null;

    async connectedCallback() {
        super.connectedCallback();
        if (!this.idPath || !this.idPath.trim()) {
            console.error('No id-path provided!')
            return;
        }

        const idPathAsArray = this.idPath.split('/');
        if (validateIdPath(idPathAsArray)) {
            console.error(`${this.idPath} is not a valid id-path!`); 
            return;
        } 

        const options = getRelewiseUIOptions();
        const tracker = getTracker(options);

        tracker.trackContentCategoryView({
            idPath: idPathAsArray,
            user: options.contextSettings.getUser(UserFactory),
        })
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-track-content-category-view': ContentCategoryView;
    }
}