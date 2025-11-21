import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { getRelewiseUIOptions } from '../../helpers/relewiseUIOptions';
import { getTracker } from '../tracker';

export class ContentView extends LitElement {

    @property({ attribute: 'content-id' })
    contentId: string | null = null;

    async connectedCallback() {
        super.connectedCallback();
        if (!this.contentId) {
            console.error('No content-id provided!');
            return;
        }

        const options = getRelewiseUIOptions();
        const tracker = getTracker(options);
        const user = await options.contextSettings.getUser();

        tracker.trackContentView({
            contentId: this.contentId,
            user: user,
        });
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-track-content-view': ContentView;
    }
}