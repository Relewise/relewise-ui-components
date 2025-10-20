import { ContentRecommendationResponse, ContentsViewedAfterViewingContentBuilder, ContentsViewedAfterViewingContentRequest } from '@relewise/client';
import { property } from 'lit/decorators.js';
import { getRecommender } from '../recommender';
import { getRelewiseUIOptions } from '../../helpers/relewiseUIOptions';
import { ContentRecommendationBase } from './content-recommendation-base';
import { getContentRecommendationBuilderWithDefaults } from '../../builders/contentRecommendationBuilder';

export class ContentViewedAfterViewingContent extends ContentRecommendationBase {

    @property({ attribute: 'content-id' })
    contentId: string | undefined = undefined;

    async fetchContent(): Promise<ContentRecommendationResponse | undefined> {
        const recommender = getRecommender(getRelewiseUIOptions());
        const request = await this.buildRequest();
        if (!request) {
            return;
        }

        return recommender.recommendContentsViewedAfterViewingContent(request);
    }

    async buildRequest(): Promise<ContentsViewedAfterViewingContentRequest | undefined> {
        if (!this.contentId) {
            console.error('No content-id attribute was provided for relewise-content-viewed-after-viewing-content.');
            return;
        }

        return (await getContentRecommendationBuilderWithDefaults<ContentsViewedAfterViewingContentBuilder>(
            settings => new ContentsViewedAfterViewingContentBuilder(settings),
            this.displayedAtLocation ? this.displayedAtLocation : 'Relewise Content Viewed After Viewing Content',
            this.target,
        ))
            .setContentId(this.contentId)
            .setNumberOfRecommendations(this.numberOfRecommendations)
            .build();
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-content-viewed-after-viewing-content': ContentViewedAfterViewingContent;
    }
}
