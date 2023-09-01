import { ProductRecommendationResponse, PurchasedWithProductBuilder } from '@relewise/client';
import { property } from 'lit/decorators.js';
import { getProductRecommendationBuilderWithDefaults } from '../../initialize';
import { getRecommender } from '../recommender';
import { ProductRecommendationBase } from './product-recommendation-base';

export class PurchasedWithProduct extends ProductRecommendationBase {

    @property({ type: Number })
    numberOfRecommendations: number = 5;

    @property()
    productId: string | undefined = undefined;

    @property()
    variantId: string | undefined = undefined;
  
    fetchProducts(): Promise<ProductRecommendationResponse | undefined> | undefined {
        if (!this.productId) {
            console.error('No productId provided!')
            return;
        }

        const recommender = getRecommender();
        const builder = getProductRecommendationBuilderWithDefaults<PurchasedWithProductBuilder>(settings => new PurchasedWithProductBuilder(settings))
            .product({
                productId: this.productId,
                variantId: this.variantId,
            })
            .setNumberOfRecommendations(this.numberOfRecommendations);

        return recommender.recommendPurchasedWithProduct(builder.build());
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-purchased-with-product': PurchasedWithProduct;
    }
}