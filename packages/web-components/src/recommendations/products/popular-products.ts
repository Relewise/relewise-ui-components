import { PopularProductsBuilder, ProductRecommendationResponse } from '@relewise/client';
import { property } from 'lit/decorators.js';
import { getProductRecommendationBuilderWithDefaults } from '../../initialize';
import { getRecommender } from '../recommender';
import { ProductRecommendationBase } from './product-recommendation-base';

export class PopularProducts extends ProductRecommendationBase {

    @property({ type: Number })
    sinceMinutesAgo: number = 20160; // 14 days

    @property({ type: Number })
    numberOfRecommendations: number = 5;

    @property()
    basedOn: 'MostPurchased' | 'MostViewed' = 'MostPurchased';

    fetchProducts(): Promise<ProductRecommendationResponse | undefined> | undefined {
        const recommender = getRecommender();
        const builder = getProductRecommendationBuilderWithDefaults<PopularProductsBuilder>(settings => new PopularProductsBuilder(settings))
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