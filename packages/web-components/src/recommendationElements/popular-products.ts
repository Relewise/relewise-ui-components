import { PopularProductsBuilder } from '@relewise/client';
import { property } from 'lit/decorators.js';
import { getProductRecommendationBuilderWithDefaults } from '../initialize';
import '../product-tile';
import { RelewiseProductRecommendationElement } from '../RelewiseProductRecommendationElement';
import { getRecommender } from '../util/recommender';

export class PopularProducts extends RelewiseProductRecommendationElement {

    @property({ type: Number })
    sinceMinutesAgo: number = 20160; // 14 days

    @property({ type: Number })
    numberOfRecommendations: number = 5;

    @property()
    basedOn: 'MostPurchased' | 'MostViewed' = 'MostPurchased';

    async fetchProducts() {
        const recommender = getRecommender();
        const builder = getProductRecommendationBuilderWithDefaults<PopularProductsBuilder>(settings => new PopularProductsBuilder(settings))
            .sinceMinutesAgo(this.sinceMinutesAgo)
            .basedOn(this.basedOn)
            .setNumberOfRecommendations(this.numberOfRecommendations);

        const result = await recommender.recommendPopularProducts(builder.build());
        this.products = result?.recommendations ?? null;
    }

}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-popular-products': PopularProducts;
    }
}