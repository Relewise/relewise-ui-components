import { ProductRecommendationResponse, PurchasedWithMultipleProductsBuilder, PurchasedWithMultipleProductsRequest } from '@relewise/client';
import { getRecommender } from '../recommender';
import { ProductRecommendationBase } from './product-recommendation-base';
import { getRelewiseUIOptions } from '../../helpers/relewiseUIOptions';
import { getProductRecommendationBuilderWithDefaults } from '../../builders/productRecommendationBuilder';

export class PurchasedWithMultipleProducts extends ProductRecommendationBase {

    private productAndVariantIds: { productId: string, variantId?: string }[] = [];

    connectedCallback(): Promise<void> {
        this.parseProductAndVariantIds();
        return super.connectedCallback();
    }

    private parseProductAndVariantIds(): void {
        const productAndVariantElements = this.querySelectorAll('product-and-variant-id');
        const productAndVariantIds: { productId: string, variantId?: string }[] = [];

        productAndVariantElements.forEach(element => {
            const productId = element.getAttribute('product-id');
            if (productId) {
                const variantId = element.getAttribute('variant-id');
                productAndVariantIds.push({ productId, variantId: variantId || undefined });
            }
        });

        this.productAndVariantIds = productAndVariantIds;
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
            console.error('No product and variant ids provided!');
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