import { PopularProductsBuilder, ProductRecommendationResponse } from '@relewise/client';
import { property } from 'lit/decorators.js';
import { getRecommender } from '../recommender';
import { ProductRecommendationBase } from './product-recommendation-base';
import { getRelewiseUIOptions } from '../../helpers/relewiseUIOptions';
import { getProductRecommendationBuilderWithDefaults } from '../../builders/productRecommendationBuilder';

export class PopularProducts extends ProductRecommendationBase {

    @property({ type: Number })
    sinceMinutesAgo: number = 20160; // 14 days

    @property()
    basedOn: 'MostPurchased' | 'MostViewed' = 'MostPurchased';

    fetchProducts(): Promise<ProductRecommendationResponse | undefined> | undefined {
        const recommender = getRecommender(getRelewiseUIOptions());
        const builder = getProductRecommendationBuilderWithDefaults<PopularProductsBuilder>(
            settings => new PopularProductsBuilder(settings),
            this.displayedAtLocation ?? '',
        )
            .sinceMinutesAgo(this.sinceMinutesAgo)
            .basedOn(this.basedOn)
            .setNumberOfRecommendations(this.numberOfRecommendations);

        return recommender.recommendPopularProducts(builder.build());
    }

}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-popular-products': PopularProducts;
    }
}