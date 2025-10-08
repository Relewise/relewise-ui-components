import { PersonalContentRecommendationBuilder, ContentRecommendationResponse } from '@relewise/client';
import { getRecommender } from '../recommender';
import { getRelewiseUIOptions } from '../../helpers/relewiseUIOptions';
import { ContentRecommendationBase } from './content-recommendation-base';
import { getContentRecommendationBuilderWithDefaults } from '../../builders/ContentRecommendationBuilder';

export class PersonalContent extends ContentRecommendationBase {

    async fetchContent(): Promise<ContentRecommendationResponse | undefined> {
        const recommender = getRecommender(getRelewiseUIOptions());
        return recommender.recommendPersonalContents(await this.buildRequest());
    }

    async buildRequest() {
        return (await getContentRecommendationBuilderWithDefaults<PersonalContentRecommendationBuilder>(
            settings => new PersonalContentRecommendationBuilder(settings),
            this.displayedAtLocation ? this.displayedAtLocation : 'Relewise Personal Content',
            this.target,
        ))
            .setNumberOfRecommendations(this.numberOfRecommendations)
            .build();
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-personal-content': PersonalContent;
    }
}

