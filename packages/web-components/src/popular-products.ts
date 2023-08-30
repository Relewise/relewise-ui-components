import { PopularProductsBuilder, ProductResult } from '@relewise/client';
import { LitElement, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { getRecommender } from './recommender';
import { getProductRecommendationBuilderWithDefaults } from './relewiseUI';

export class PopularProducts extends LitElement {

    @property({ type: Number })
    sinceMinutesAgo: number = 20160 ; // 14 days

    @property({ type: Number })
    numberOfRecommendations: number = 5;

    @property()
    basedOn: 'MostPurchased' | 'MostViewed' = 'MostPurchased';

    @state()
    products: ProductResult[] | null = null;

    async fetchProducts() {
        const recommender = getRecommender();
        const builder = getProductRecommendationBuilderWithDefaults<PopularProductsBuilder>(settings => new PopularProductsBuilder(settings))
            .sinceMinutesAgo(this.sinceMinutesAgo)
            .basedOn(this.basedOn)
            .setNumberOfRecommendations(this.numberOfRecommendations);

        const result = await recommender.recommendPopularProducts(builder.build());
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
        'relewise-popular-products': PopularProducts;
    }
}