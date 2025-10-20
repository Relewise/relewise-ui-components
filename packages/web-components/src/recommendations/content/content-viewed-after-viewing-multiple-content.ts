import { ContentRecommendationResponse, ContentsViewedAfterViewingMultipleContentsBuilder, ContentsViewedAfterViewingMultipleContentsRequest } from '@relewise/client';
import { getRecommender } from '../recommender';
import { getRelewiseUIOptions } from '../../helpers/relewiseUIOptions';
import { ContentRecommendationBase } from './content-recommendation-base';
import { getContentRecommendationBuilderWithDefaults } from '../../builders/contentRecommendationBuilder';

export class ContentViewedAfterViewingMultipleContent extends ContentRecommendationBase {

    private contentIds: string[] = [];

    connectedCallback(): Promise<void> {
        this.parseContentIds();
        return super.connectedCallback();
    }

    private parseContentIds(): void {
        const contentElements = this.querySelectorAll('content-id');
        const ids: string[] = [];

        contentElements.forEach(element => {
            const contentId = element.getAttribute('content-id');
            if (contentId) {
                ids.push(contentId);
            }
        });

        this.contentIds = ids;
    }

    async fetchContent(): Promise<ContentRecommendationResponse | undefined> {
        const recommender = getRecommender(getRelewiseUIOptions());
        const request = await this.buildRequest();
        if (!request) {
            return;
        }

        return recommender.recommendContentsViewedAfterViewingMultipleContents(request);
    }

    async buildRequest(): Promise<ContentsViewedAfterViewingMultipleContentsRequest | undefined> {
        this.parseContentIds();

        if (!this.contentIds || this.contentIds.length === 0) {
            console.error('No content ids were provided for relewise-content-viewed-after-viewing-multiple-content.');
            return;
        }

        return (await getContentRecommendationBuilderWithDefaults<ContentsViewedAfterViewingMultipleContentsBuilder>(
            settings => new ContentsViewedAfterViewingMultipleContentsBuilder(settings),
            this.displayedAtLocation ? this.displayedAtLocation : 'Relewise Content Viewed After Viewing Multiple Content',
            this.target,
        ))
            .setContentIds(...this.contentIds)
            .setNumberOfRecommendations(this.numberOfRecommendations)
            .build();
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-content-viewed-after-viewing-multiple-content': ContentViewedAfterViewingMultipleContent;
    }
}
