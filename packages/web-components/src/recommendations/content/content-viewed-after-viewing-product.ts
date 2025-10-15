import { ContentRecommendationResponse, ContentsViewedAfterViewingProductBuilder, ContentsViewedAfterViewingProductRequest } from '@relewise/client';
import { property } from 'lit/decorators.js';
import { getRecommender } from '../recommender';
import { getRelewiseUIOptions } from '../../helpers/relewiseUIOptions';
import { ContentRecommendationBase } from './content-recommendation-base';
import { getContentRecommendationBuilderWithDefaults } from '../../builders/contentRecommendationBuilder';

export class ContentViewedAfterViewingProduct extends ContentRecommendationBase {

    @property({ attribute: 'product-id' })
    productId: string | undefined = undefined;

    @property({ attribute: 'variant-id' })
    variantId: string | undefined = undefined;

    async fetchContent(): Promise<ContentRecommendationResponse | undefined> {
        const recommender = getRecommender(getRelewiseUIOptions());
        const request = await this.buildRequest();
        if (!request) {
            return;
        }

        return recommender.recommendContentsViewedAfterViewingProduct(request);
    }

    async buildRequest(): Promise<ContentsViewedAfterViewingProductRequest | undefined> {
        if (!this.productId) {
            console.error('No product-id attribute was provided for relewise-content-viewed-after-viewing-product.');
            return;
        }

        return (await getContentRecommendationBuilderWithDefaults<ContentsViewedAfterViewingProductBuilder>(
            settings => new ContentsViewedAfterViewingProductBuilder(settings),
            this.displayedAtLocation ? this.displayedAtLocation : 'Relewise Content Viewed After Viewing Product',
            this.target,
        ))
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
        'relewise-content-viewed-after-viewing-product': ContentViewedAfterViewingProduct;
    }
}
