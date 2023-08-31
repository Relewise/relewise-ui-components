import { ProductResult, ProductsViewedAfterViewingProductBuilder } from '@relewise/client';
import { LitElement, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { getRecommender } from './recommender';
import { getProductRecommendationBuilderWithDefaults } from './relewiseUI';

export class ProductsViewedAfterViewingProduct extends LitElement {

    @property({ type: Number })
    numberOfRecommendations: number = 5;

    @property()
    productId: string | undefined = undefined;

    @property()
    variantId: string | undefined = undefined;

    @state()
    products: ProductResult[] | null = null;

    async fetchProducts() {
        if(!this.productId) {
            console.error('No productId provided!')
            return;
        }

        const recommender = getRecommender();
        const builder = getProductRecommendationBuilderWithDefaults<ProductsViewedAfterViewingProductBuilder>(settings => new ProductsViewedAfterViewingProductBuilder(settings))
        .product({
            productId: this.productId,
            variantId: this.variantId
        })
        .setNumberOfRecommendations(this.numberOfRecommendations);

        const result = await recommender.recommendProductsViewedAfterViewingProduct(builder.build());
        this.products = result?.recommendations ?? null;
    }

    connectedCallback(): void {
        super.connectedCallback();
        this.fetchProducts();
    }

    render() {
        if (this.products) {
            return this.products.map(product =>
                html`<h1>${product.displayName}</h1>`,
            )
        }
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-products-viewed-after-viewing-product': ProductsViewedAfterViewingProduct;
    }
}