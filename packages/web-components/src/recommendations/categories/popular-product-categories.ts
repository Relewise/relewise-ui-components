import {
    PopularProductCategoriesRecommendationBuilder,
    PopularProductCategoriesRecommendationRequest,
    ProductCategoryRecommendationResponse,
    ProductCategoryResult,
} from '@relewise/client';
import { consume } from '@lit/context';
import { html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { getProductCategoryRecommendationBuilderWithDefaults } from '../../builders/categoryRecommendationBuilder';
import { Events } from '../../helpers/events';
import { getRelewiseUIOptions } from '../../helpers/relewiseUIOptions';
import {
    productCategoryRecommendationBatchingContext,
} from './category-recommendation-batching';
import { CategoryRecommendationBase } from './category-recommendation-base';
import { getRecommender } from '../recommender';

export class PopularProductCategories extends CategoryRecommendationBase<
    ProductCategoryResult,
    PopularProductCategoriesRecommendationRequest,
    ProductCategoryRecommendationResponse
> {
    @consume({ context: productCategoryRecommendationBatchingContext, subscribe: true })
    @state()
    protected providedData?: {
        enabled?: boolean;
        requests: Array<{
            request: PopularProductCategoriesRecommendationRequest;
            id: EventTarget | null;
            result?: ProductCategoryRecommendationResponse | null;
        }>;
    };

    protected readonly registerRecommendationEvent = Events.registerProductCategoryRecommendation;

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
