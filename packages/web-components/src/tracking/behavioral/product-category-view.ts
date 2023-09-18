import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { UserFactory } from '@relewise/client';
import { getTracker } from '../tracker';
import { getRelewiseUIOptions } from '../../helpers/relewiseUIOptions';
import { validateIdPath } from '../../helpers/idPathValidator';

export class ProductCategoryView extends LitElement {

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

        tracker.trackProductCategoryView({
            idPath: idPathAsArray,
            user: options.contextSettings.getUser(UserFactory),
        })
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-track-product-category-view': ProductCategoryView;
    }
}