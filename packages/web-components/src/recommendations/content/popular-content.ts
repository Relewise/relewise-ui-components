import { ContentRecommendationResponse, Settings, PopularContentsBuilder } from '@relewise/client';
import { property } from 'lit/decorators.js';
import { getRecommender } from '../recommender';
import { getRelewiseUIOptions } from '../../helpers/relewiseUIOptions';
import { ContentRecommendationBase } from './content-recommendation-base';
import { getContentRecommendationBuilderWithDefaults } from '../../builders/contentRecommendationBuilder';

export class PopularContent extends ContentRecommendationBase {

    @property({ type: Number, attribute: 'since-minutes-ago' })
    sinceMinutesAgo: number = 20160; // 14 days

    async fetchContent(): Promise<ContentRecommendationResponse | undefined> {
        const recommender = getRecommender(getRelewiseUIOptions());
        return recommender.recommendPopularContents(await this.buildRequest());
    }

    async buildRequest() {
        return (await getContentRecommendationBuilderWithDefaults<PopularContentsBuilder>(
            (settings: Settings) => new PopularContentsBuilder(settings),
            this.displayedAtLocation ? this.displayedAtLocation : 'Relewise Popular Content',
            this.target,
        )) 
            .sinceMinutesAgo(this.sinceMinutesAgo)
            .setNumberOfRecommendations(this.numberOfRecommendations)
            .build();
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-popular-content': PopularContent;
    }
}

