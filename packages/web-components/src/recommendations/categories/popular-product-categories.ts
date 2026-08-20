import {
    PopularProductCategoriesRecommendationBuilder,
    PopularProductCategoriesRecommendationRequest,
    ProductCategoryRecommendationResponse,
    ProductCategoryResult,
} from '@relewise/client';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { getProductCategoryRecommendationBuilderWithDefaults } from '../../builders/categoryRecommendationBuilder';
import { getRelewiseUIOptions } from '../../helpers/relewiseUIOptions';
import { CategoryRecommendationBase } from './category-recommendation-base';
import { getRecommender } from '../recommender';

export class PopularProductCategories extends CategoryRecommendationBase<ProductCategoryResult, PopularProductCategoriesRecommendationRequest> {

    @property({ type: Number, attribute: 'since-minutes-ago' })
    sinceMinutesAgo = 20160;

    async fetchCategories(): Promise<ProductCategoryRecommendationResponse | undefined> {
        const recommender = getRecommender(getRelewiseUIOptions());
        return recommender.recommendPopularProductCategories(await this.buildRequest());
    }

    async buildRequest() {
        return (await getProductCategoryRecommendationBuilderWithDefaults(
            settings => new PopularProductCategoriesRecommendationBuilder(settings),
            this.displayedAtLocation ?? 'Relewise Popular Product Categories',
            this.target,
        ))
            .sinceMinutesAgo(this.sinceMinutesAgo)
            .setNumberOfRecommendations(this.numberOfRecommendations)
            .build();
    }

    protected renderCategory(category: ProductCategoryResult) {
        return html`
            <relewise-product-category-tile
                part="category-tile"
                exportparts="link, container, image-container, image, information, display-name"
                .productCategory=${category}>
            </relewise-product-category-tile>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-popular-product-categories': PopularProductCategories;
    }
}
