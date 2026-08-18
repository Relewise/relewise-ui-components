import { RelewiseLitElement } from '../relewise-lit-element';

export interface RecommendationStateChangedEventDetail {
    loading: boolean;
    hasResults: boolean;
}

export const recommendationStateChangedEventName = 'relewise-ui-components:recommendation-state-changed';

export abstract class RecommendationStateElement extends RelewiseLitElement {
    private lastReportedRecommendationState?: RecommendationStateChangedEventDetail;

    protected reportRecommendationState(state: RecommendationStateChangedEventDetail): void {
        if (this.lastReportedRecommendationState?.loading === state.loading
            && this.lastReportedRecommendationState.hasResults === state.hasResults) {
            return;
        }

        this.lastReportedRecommendationState = state;
        this.dispatchEvent(new CustomEvent<RecommendationStateChangedEventDetail>(recommendationStateChangedEventName, {
            bubbles: true,
            composed: true,
            detail: state,
        }));
    }
}
