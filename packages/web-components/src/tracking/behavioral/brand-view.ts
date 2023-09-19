import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { getTracker } from '../tracker';
import { getRelewiseUIOptions } from '../../helpers/relewiseUIOptions';

export class BrandView extends LitElement {

    @property({ attribute: 'brand-id' })
    brandId: string | null = null;

    async connectedCallback() {
        super.connectedCallback();
        if (!this.brandId) {
            console.error('No brand-id provided!')
            return;
        }
        
        const options = getRelewiseUIOptions();
        const tracker = getTracker(options);
        tracker.trackBrandView( {
            brandId: this.brandId,
            user: options.contextSettings.getUser(),
        })
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-track-brand-view': BrandView;
    }
}