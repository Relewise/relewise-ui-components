import { ProductRecommendationResponse, ProductsViewedAfterViewingContentBuilder, ProductsViewedAfterViewingContentRequest } from '@relewise/client';
import { property } from 'lit/decorators.js';
import { getRecommender } from '../recommender';
import { ProductRecommendationBase } from './product-recommendation-base';
import { getRelewiseUIOptions } from '../../helpers/relewiseUIOptions';
import { getProductRecommendationBuilderWithDefaults } from '../../builders/productRecommendationBuilder';

export class ProductsViewedAfterViewingContent extends ProductRecommendationBase {

    @property({ attribute: 'content-id' })
    contentId: string | undefined = undefined;

    async fetchProducts(): Promise<ProductRecommendationResponse | undefined> {
        const recommender = getRecommender(getRelewiseUIOptions());
        const request = await this.buildRequest();
        if (!request) { 
            return; 
        }

        return recommender.recommendProductsViewedAfterViewingContent(request);
    }

    async buildRequest(): Promise<ProductsViewedAfterViewingContentRequest | undefined> {
        if (!this.contentId) {
            console.error('No content-id attribute was provided for relewise-products-viewed-after-viewing-content.');
            return;
        }

        return (await getProductRecommendationBuilderWithDefaults<ProductsViewedAfterViewingContentBuilder>(
            settings => new ProductsViewedAfterViewingContentBuilder(settings),
            this.displayedAtLocation ? this.displayedAtLocation : 'Relewise Products Viewed After Viewing Content',
            this.target,
        ))
            .setContentId(this.contentId)
            .setNumberOfRecommendations(this.numberOfRecommendations)
            .build();
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-products-viewed-after-viewing-content': ProductsViewedAfterViewingContent;
    }
}