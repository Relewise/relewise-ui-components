import { PersonalProductRecommendationBuilder, ProductRecommendationResponse } from '@relewise/client';
import { getRecommender } from '../recommender';
import { ProductRecommendationBase } from './product-recommendation-base';
import { getRelewiseUIOptions } from '../../helpers/relewiseUIOptions';
import { getProductRecommendationBuilderWithDefaults } from '../../builders/productRecommendationBuilder';

export class PersonalProducts extends ProductRecommendationBase {

    async fetchProducts(): Promise<ProductRecommendationResponse | undefined> {
        const recommender = getRecommender(getRelewiseUIOptions());
        return recommender.recommendPersonalProducts(await this.buildRequest());
    }

    async buildRequest() {
        return (await getProductRecommendationBuilderWithDefaults<PersonalProductRecommendationBuilder>(
            settings => new PersonalProductRecommendationBuilder(settings),
            this.displayedAtLocation ? this.displayedAtLocation : 'Relewise Personal Products',
            this.target,
        ))
            .setNumberOfRecommendations(this.numberOfRecommendations)
            .build();
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-personal-products': PersonalProducts;
    }
}