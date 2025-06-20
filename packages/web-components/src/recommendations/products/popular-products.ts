import { PopularProductsBuilder, ProductRecommendationResponse } from '@relewise/client';
import { property } from 'lit/decorators.js';
import { getRecommender } from '../recommender';
import { ProductRecommendationBase } from './product-recommendation-base';
import { getRelewiseUIOptions } from '../../helpers/relewiseUIOptions';
import { getProductRecommendationBuilderWithDefaults } from '../../builders/productRecommendationBuilder';

export class PopularProducts extends ProductRecommendationBase {

    @property({ type: Number, attribute: 'since-minutes-ago' })
    sinceMinutesAgo: number = 20160; // 14 days

    @property({ attribute: 'based-on' })
    basedOn: 'MostPurchased' | 'MostViewed' = 'MostPurchased';

    async fetchProducts(): Promise<ProductRecommendationResponse | undefined> {
        const recommender = getRecommender(getRelewiseUIOptions());
        return recommender.recommendPopularProducts(await this.buildRequest());
    }

    async buildRequest() {
        return (await getProductRecommendationBuilderWithDefaults<PopularProductsBuilder>(
            settings => new PopularProductsBuilder(settings),
            this.displayedAtLocation ? this.displayedAtLocation : 'Relewise Popular Products',
            this.target,
        ))
            .sinceMinutesAgo(this.sinceMinutesAgo)
            .basedOn(this.basedOn)
            .setNumberOfRecommendations(this.numberOfRecommendations)
            .build();
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-popular-products': PopularProducts;
    }
}