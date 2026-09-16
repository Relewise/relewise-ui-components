import {
    ProductRecommendationResponse,
    SearchTermBasedProductRecommendationBuilder,
} from '@relewise/client';
import { property } from 'lit/decorators.js';
import { getProductRecommendationBuilderWithDefaults } from '../../builders/productRecommendationBuilder';
import { getRelewiseUIOptions } from '../../helpers/relewiseUIOptions';
import { getRecommender } from '../recommender';
import { ProductRecommendationBase } from './product-recommendation-base';

export class SearchTermBasedProducts extends ProductRecommendationBase {

    @property({ type: String })
    term = '';

    async fetchProducts(): Promise<ProductRecommendationResponse | undefined> {
        if (!this.term) {
            return;
        }

        const recommender = getRecommender(getRelewiseUIOptions());
        const request = await this.buildRequest();
        if (!request) {
            return;
        }

        return recommender.recommendSearchTermBasedProducts(request);
    }

    async buildRequest() {
        if (!this.term) {
            return;
        }

        return (await getProductRecommendationBuilderWithDefaults(
            settings => new SearchTermBasedProductRecommendationBuilder(settings),
            this.displayedAtLocation ?? 'Relewise Search Term Based Products',
            this.target,
        ))
            .setTerm(this.term)
            .setNumberOfRecommendations(this.numberOfRecommendations)
            .build();
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-search-term-based-products': SearchTermBasedProducts;
    }
}
