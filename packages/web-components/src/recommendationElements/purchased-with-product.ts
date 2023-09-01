import { PurchasedWithProductBuilder } from '@relewise/client';
import { property } from 'lit/decorators.js';
import { getProductRecommendationBuilderWithDefaults } from '../initialize';
import { RelewiseProductRecommendationElement } from '../RelewiseProductRecommendationElement';
import { getRecommender } from '../util/recommender';

export class PurchasedWithProduct extends RelewiseProductRecommendationElement {

    @property({ type: Number })
    numberOfRecommendations: number = 5;

    @property()
    productId: string | undefined = undefined;

    @property()
    variantId: string | undefined = undefined;
  
    async fetchProducts() {
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

        const result = await recommender.recommendPurchasedWithProduct(builder.build());
        this.products = result?.recommendations ?? null;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-purchased-with-product': PurchasedWithProduct;
    }
}