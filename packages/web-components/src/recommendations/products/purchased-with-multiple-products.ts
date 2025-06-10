import { ProductRecommendationResponse, PurchasedWithMultipleProductsBuilder, PurchasedWithMultipleProductsRequest } from '@relewise/client';
import { property } from 'lit/decorators.js';
import { getRecommender } from '../recommender';
import { ProductRecommendationBase } from './product-recommendation-base';
import { getRelewiseUIOptions } from '../../helpers/relewiseUIOptions';
import { getProductRecommendationBuilderWithDefaults } from '../../builders/productRecommendationBuilder';

export class PurchasedWithMultipleProducts extends ProductRecommendationBase {

    @property({ type: Array, attribute: 'product-and-variant-ids' })
    productAndVariantIds: { productId: string, variantId?: string }[] | undefined = undefined;

    fetchProducts(): Promise<ProductRecommendationResponse | undefined> | undefined {
        const recommender = getRecommender(getRelewiseUIOptions());
        const request = this.buildRequest();
        if (!request) { 
            return; 
        }

        return recommender.recommendPurchasedWithMultipleProducts(request);
    }

    buildRequest(): PurchasedWithMultipleProductsRequest | undefined {
        if (!this.productAndVariantIds || this.productAndVariantIds.length === 0) {
            console.error('No product and variant ids provided!');
            return;
        }

        return getProductRecommendationBuilderWithDefaults<PurchasedWithMultipleProductsBuilder>(
            settings => new PurchasedWithMultipleProductsBuilder(settings),
            this.displayedAtLocation ? this.displayedAtLocation : 'Relewise Purchased With Multiple Products',
        )
            .addProducts(this.productAndVariantIds)
            .setNumberOfRecommendations(this.numberOfRecommendations)
            .build();
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-purchased-with-multiple-products': PurchasedWithMultipleProducts;
    }
}