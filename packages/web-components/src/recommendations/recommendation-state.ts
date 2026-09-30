import { RelewiseLitElement } from '../relewise-lit-element';
import { Events } from '../helpers/events';

export interface RecommendationStateChangedEventDetail {
    loading: boolean;
    hasResults: boolean;
}

export abstract class RecommendationStateElement extends RelewiseLitElement {
    private lastReportedRecommendationState?: RecommendationStateChangedEventDetail;

    protected hasResultHeadingTemplate(): boolean {
        return this.renderRoot !== this && this.querySelector(':scope > template[slot="result-heading"]') !== null;
    }

    protected addHeadingFromTemplate(): void {
        const template = this.querySelector<HTMLTemplateElement>(':scope > template[slot="result-heading"]');
        const heading = template?.content.firstElementChild;

        // The template stays inert until results create the slot. Adding the
        // clone triggers another slotchange, so only add it once.
        if (heading && !this.querySelector(':scope > :not(template)[slot="result-heading"]')) {
            const clone = heading.cloneNode(true) as Element;
            clone.setAttribute('slot', 'result-heading');
            this.append(clone);
        }
    }

    protected reportRecommendationState(state: RecommendationStateChangedEventDetail): void {
        if (this.lastReportedRecommendationState?.loading === state.loading
            && this.lastReportedRecommendationState.hasResults === state.hasResults) {
            return;
        }

        this.lastReportedRecommendationState = state;
        this.dispatchEvent(new CustomEvent<RecommendationStateChangedEventDetail>(Events.recommendationStateChanged, {
            bubbles: true,
            composed: true,
            detail: state,
        }));
    }
}

declare global {
    interface HTMLElementEventMap {
        'relewise-ui-components:recommendation-state-changed': CustomEvent<RecommendationStateChangedEventDetail>;
    }
}
