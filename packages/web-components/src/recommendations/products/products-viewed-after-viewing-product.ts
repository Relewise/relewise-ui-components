import { ProductRecommendationResponse, ProductsViewedAfterViewingProductBuilder } from '@relewise/client';
import { property } from 'lit/decorators.js';
import { getRecommender } from '../recommender';
import { ProductRecommendationBase } from './product-recommendation-base';
import {  getRelewiseUIOptions } from '../../helpers/relewiseUIOptions';
import { getProductRecommendationBuilderWithDefaults } from '../../builders/productRecommendationBuilder';

export class ProductsViewedAfterViewingProduct extends ProductRecommendationBase {
    
    @property()
    productId: string | undefined = undefined;

    @property()
    variantId: string | undefined = undefined;
  
    fetchProducts(): Promise<ProductRecommendationResponse | undefined> | undefined {
        if (!this.productId) {
            console.error('No productId provided!')
            return;
        }

        const recommender = getRecommender(getRelewiseUIOptions());
        const builder = getProductRecommendationBuilderWithDefaults<ProductsViewedAfterViewingProductBuilder>(
            settings => new ProductsViewedAfterViewingProductBuilder(settings),
            this.displayedAtLocation,
        )
            .product({
                productId: this.productId,
                variantId: this.variantId,
            })
            .setNumberOfRecommendations(this.numberOfRecommendations);

        return recommender.recommendProductsViewedAfterViewingProduct(builder.build());
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-products-viewed-after-viewing-product': ProductsViewedAfterViewingProduct;
    }
}