import { ProductRecommendationResponse, ProductsViewedAfterViewingProductBuilder, ProductsViewedAfterViewingProductRequest } from '@relewise/client';
import { property } from 'lit/decorators.js';
import { getRecommender } from '../recommender';
import { ProductRecommendationBase } from './product-recommendation-base';
import { getRelewiseUIOptions } from '../../helpers/relewiseUIOptions';
import { getProductRecommendationBuilderWithDefaults } from '../../builders/productRecommendationBuilder';

export class ProductsViewedAfterViewingProduct extends ProductRecommendationBase {

    @property({ attribute: 'product-id' })
    productId: string | undefined = undefined;

    @property({ attribute: 'variant-id' })
    variantId: string | undefined = undefined;

    fetchProducts(): Promise<ProductRecommendationResponse | undefined> | undefined {
        const recommender = getRecommender(getRelewiseUIOptions());
        const request = this.buildRequest();
        if (!request) { 
            return; 
        }

        return recommender.recommendProductsViewedAfterViewingProduct(request);
    }

    buildRequest(): ProductsViewedAfterViewingProductRequest | undefined {
        if (!this.productId) {
            console.error('No productId provided!');
            return;
        }

        return getProductRecommendationBuilderWithDefaults<ProductsViewedAfterViewingProductBuilder>(
            settings => new ProductsViewedAfterViewingProductBuilder(settings),
            this.displayedAtLocation ? this.displayedAtLocation : 'Relewise Products Viewed After Viewing Product',
        )
            .product({
                productId: this.productId,
                variantId: this.variantId,
            })
            .setNumberOfRecommendations(this.numberOfRecommendations)
            .build();
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-products-viewed-after-viewing-product': ProductsViewedAfterViewingProduct;
    }
}