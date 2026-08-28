import { RelewiseLitElement } from '../relewise-lit-element';
import { Events } from '../helpers/events';

export interface RecommendationStateChangedEventDetail {
    loading: boolean;
    hasResults: boolean;
}

export abstract class RecommendationStateElement extends RelewiseLitElement {
    private lastReportedRecommendationState?: RecommendationStateChangedEventDetail;

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
