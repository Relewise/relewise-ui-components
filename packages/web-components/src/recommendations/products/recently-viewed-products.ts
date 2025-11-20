import { RecentlyViewedProductsBuilder, ProductRecommendationResponse, userIsAnonymous } from '@relewise/client';
import { getRecommender } from '../recommender';
import { ProductRecommendationBase } from './product-recommendation-base';
import { getRelewiseUIOptions } from '../../helpers/relewiseUIOptions';
import { getProductRecommendationBuilderWithDefaults } from '../../builders/productRecommendationBuilder';

export class RecentlyViewedProducts extends ProductRecommendationBase {

    async fetchProducts(): Promise<ProductRecommendationResponse | undefined> {
        const options = getRelewiseUIOptions();

        const user = await options.contextSettings.getUser();

        // The API will never return a result for a user that can't be identified
        if (userIsAnonymous(user)) {
            return;
        }

        const recommender = getRecommender(getRelewiseUIOptions());
        const request = await this.buildRequest();
        if (!request)
            return;

        return recommender.recentlyViewedProducts(request);
    }

    async buildRequest() {
        return (await getProductRecommendationBuilderWithDefaults<RecentlyViewedProductsBuilder>(
            settings => new RecentlyViewedProductsBuilder(settings),
            this.displayedAtLocation ? this.displayedAtLocation : 'Relewise Recently Viewed Products',
            this.target,
        ))
            .setNumberOfRecommendations(this.numberOfRecommendations)
            .build();
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-recently-viewed-products': RecentlyViewedProducts;
    }
}
