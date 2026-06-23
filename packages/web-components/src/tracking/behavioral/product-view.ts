import { RelewiseLitElement } from '../../relewise-lit-element';
import { property } from 'lit/decorators.js';
import { getRelewiseUIOptions } from '../../helpers/relewiseUIOptions';
import { getTracker } from '../tracker';

export class ProductView extends RelewiseLitElement {

    @property({ attribute: 'product-id' })
    productId: string | null = null;

    @property({ attribute: 'variant-id' })
    variantId: string | undefined = undefined;

    async connectedCallback() {
        super.connectedCallback();
        if (!this.productId) {
            console.error('No product-id provided!');
            return;
        }

        const options = getRelewiseUIOptions();
        const tracker = getTracker(options);
        const user = await options.contextSettings.getUser();
        tracker.trackProductView({
            productId: this.productId,
            variantId: this.variantId,
            user: user,
        });
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-track-product-view': ProductView;
    }
}