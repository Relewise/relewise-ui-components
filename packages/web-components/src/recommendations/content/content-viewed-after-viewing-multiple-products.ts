import { ContentRecommendationResponse, ContentsViewedAfterViewingMultipleProductsBuilder, ContentsViewedAfterViewingMultipleProductsRequest } from '@relewise/client';
import { ContentRecommendationBase } from './content-recommendation-base';
import { getRecommender } from '../recommender';
import { getRelewiseUIOptions } from '../../helpers/relewiseUIOptions';
import { getContentRecommendationBuilderWithDefaults } from '../../builders/contentRecommendationBuilder';

export class ContentViewedAfterViewingMultipleProducts extends ContentRecommendationBase {

    private productAndVariantIds: { productId: string; variantId?: string }[] = [];

    connectedCallback(): Promise<void> {
        this.parseProductAndVariantIds();
        return super.connectedCallback();
    }

    private parseProductAndVariantIds(): void {
        const productAndVariantElements = this.querySelectorAll('product-and-variant-id');
        const productAndVariantIds: { productId: string; variantId?: string }[] = [];

        productAndVariantElements.forEach(element => {
            const productId = element.getAttribute('product-id');
            if (productId) {
                const variantId = element.getAttribute('variant-id') ?? undefined;
                productAndVariantIds.push({ productId, variantId });
            }
        });

        this.productAndVariantIds = productAndVariantIds;
    }

    async fetchContent(): Promise<ContentRecommendationResponse | undefined> {
        const recommender = getRecommender(getRelewiseUIOptions());
        const request = await this.buildRequest();
        if (!request) {
            return;
        }

        return recommender.recommendContentsViewedAfterViewingMultipleProducts(request);
    }

    async buildRequest(): Promise<ContentsViewedAfterViewingMultipleProductsRequest | undefined> {
        this.parseProductAndVariantIds();

        if (!this.productAndVariantIds || this.productAndVariantIds.length === 0) {
            console.error('No product and variant ids were provided for relewise-content-viewed-after-viewing-multiple-products.');
            return;
        }

        return (await getContentRecommendationBuilderWithDefaults<ContentsViewedAfterViewingMultipleProductsBuilder>(
            settings => new ContentsViewedAfterViewingMultipleProductsBuilder(settings),
            this.displayedAtLocation ? this.displayedAtLocation : 'Relewise Content Viewed After Viewing Multiple Products',
            this.target,
        ))
            .addProducts(this.productAndVariantIds)
            .setNumberOfRecommendations(this.numberOfRecommendations)
            .build();
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-content-viewed-after-viewing-multiple-products': ContentViewedAfterViewingMultipleProducts;
    }
}
