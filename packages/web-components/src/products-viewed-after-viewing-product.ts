import { ProductsViewedAfterViewingProductBuilder } from '@relewise/client';
import { property } from 'lit/decorators.js';
import { getProductRecommendationBuilderWithDefaults } from './initialize';
import { RelewiseUIComponent } from './relewiseUIComponent';
import { getRecommender } from './util/recommender';

export class ProductsViewedAfterViewingProduct extends RelewiseUIComponent {

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
        const builder = getProductRecommendationBuilderWithDefaults<ProductsViewedAfterViewingProductBuilder>(settings => new ProductsViewedAfterViewingProductBuilder(settings))
            .product({
                productId: this.productId,
                variantId: this.variantId,
            })
            .setNumberOfRecommendations(this.numberOfRecommendations);

        const result = await recommender.recommendProductsViewedAfterViewingProduct(builder.build());
        this.products = result?.recommendations ?? null;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-products-viewed-after-viewing-product': ProductsViewedAfterViewingProduct;
    }
}