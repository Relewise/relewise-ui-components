import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { UserFactory } from '@relewise/client';
import { getTracker } from '../tracker';
import { getRelewiseUIOptions } from '../../helpers/relewiseUIOptions';

export class ContentView extends LitElement {

    @property({ attribute: 'content-id' })
    contentId: string | null = null;

    async connectedCallback() {
        super.connectedCallback();
        if (!this.contentId) {
            console.error('No content-id provided!')
            return;
        }
        
        const options = getRelewiseUIOptions();
        const tracker = getTracker(options);
        tracker.trackContentView({
            contentId: this.contentId,
            user: options.contextSettings.getUser(UserFactory),
        },
        )
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-track-content-view': ContentView;
    }
}