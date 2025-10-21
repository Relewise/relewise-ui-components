import { ProductRecommendationResponse, PurchasedWithMultipleProductsBuilder, PurchasedWithMultipleProductsRequest } from '@relewise/client';
import { getRecommender } from '../recommender';
import { ProductRecommendationBase } from './product-recommendation-base';
import { getRelewiseUIOptions } from '../../helpers/relewiseUIOptions';
import { getProductRecommendationBuilderWithDefaults } from '../../builders/productRecommendationBuilder';
import { extractProductAndVariantIds, ProductAndVariantId } from '../../helpers/extractProductAndVariantIds';

export class PurchasedWithMultipleProducts extends ProductRecommendationBase {

    private productAndVariantIds: ProductAndVariantId[] = [];

    connectedCallback(): Promise<void> {
        this.parseProductAndVariantIds();
        return super.connectedCallback();
    }

    private parseProductAndVariantIds(): void {
        this.productAndVariantIds = extractProductAndVariantIds(this);
    }

    async fetchProducts(): Promise<ProductRecommendationResponse | undefined> {
        const recommender = getRecommender(getRelewiseUIOptions());
        const request = await this.buildRequest();
        if (!request) { 
            return; 
        }

        return recommender.recommendPurchasedWithMultipleProducts(request);
    }

    async buildRequest(): Promise<PurchasedWithMultipleProductsRequest | undefined> {
        if (!this.productAndVariantIds || this.productAndVariantIds.length === 0) {
            console.error('No product and variant ids was provided for relewise-purchased-with-multiple-products.');
            return;
        }
        
        return (await getProductRecommendationBuilderWithDefaults<PurchasedWithMultipleProductsBuilder>(
            settings => new PurchasedWithMultipleProductsBuilder(settings),
            this.displayedAtLocation ? this.displayedAtLocation : 'Relewise Purchased With Multiple Products',
            this.target,
        ))
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