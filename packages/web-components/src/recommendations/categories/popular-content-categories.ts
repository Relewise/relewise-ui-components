import {
    ContentCategoryRecommendationResponse,
    ContentCategoryResult,
    PopularContentCategoriesRecommendationBuilder,
    PopularContentCategoriesRecommendationRequest,
} from '@relewise/client';
import { consume } from '@lit/context';
import { html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { getContentCategoryRecommendationBuilderWithDefaults } from '../../builders/categoryRecommendationBuilder';
import { Events } from '../../helpers/events';
import { getRelewiseUIOptions } from '../../helpers/relewiseUIOptions';
import {
    contentCategoryRecommendationBatchingContext,
} from './category-recommendation-batching';
import { RecommendationBatchingContextValue } from '../recommendation-batching';
import { CategoryRecommendationBase } from './category-recommendation-base';
import { getRecommender } from '../recommender';

export class PopularContentCategories extends CategoryRecommendationBase<
    ContentCategoryResult,
    PopularContentCategoriesRecommendationRequest,
    ContentCategoryRecommendationResponse
> {
    @consume({ context: contentCategoryRecommendationBatchingContext, subscribe: true })
    @state()
    protected providedData?: RecommendationBatchingContextValue<PopularContentCategoriesRecommendationRequest, ContentCategoryRecommendationResponse>;

    protected readonly registerRecommendationEvent = Events.registerContentCategoryRecommendation;

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
                part="category-tile"
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
