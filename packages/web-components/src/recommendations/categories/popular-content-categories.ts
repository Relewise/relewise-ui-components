import {
    ContentCategoryRecommendationResponse,
    ContentCategoryResult,
    PopularContentCategoriesRecommendationBuilder,
    PopularContentCategoriesRecommendationRequest,
} from '@relewise/client';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { getContentCategoryRecommendationBuilderWithDefaults } from '../../builders/categoryRecommendationBuilder';
import { getRelewiseUIOptions } from '../../helpers/relewiseUIOptions';
import { CategoryRecommendationBase } from './category-recommendation-base';
import { getRecommender } from '../recommender';

export class PopularContentCategories extends CategoryRecommendationBase<ContentCategoryResult, PopularContentCategoriesRecommendationRequest> {

    @property({ type: Number, attribute: 'since-minutes-ago' })
    sinceMinutesAgo = 20160;

    async fetchCategories(): Promise<ContentCategoryRecommendationResponse | undefined> {
        const recommender = getRecommender(getRelewiseUIOptions());
        return recommender.recommendPopularContentCategories(await this.buildRequest());
    }

    async buildRequest() {
        return (await getContentCategoryRecommendationBuilderWithDefaults(
            settings => new PopularContentCategoriesRecommendationBuilder(settings),
            this.displayedAtLocation ?? 'Relewise Popular Content Categories',
            this.target,
        ))
            .sinceMinutesAgo(this.sinceMinutesAgo)
            .setNumberOfRecommendations(this.numberOfRecommendations)
            .build();
    }

    protected renderCategory(category: ContentCategoryResult) {
        return html`
            <relewise-content-category-tile
                exportparts="link, container, image-container, image, information, display-name"
                .contentCategory=${category}>
            </relewise-content-category-tile>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-popular-content-categories': PopularContentCategories;
    }
}
