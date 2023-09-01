import { PopularProductsBuilder, ProductResult } from '@relewise/client';
import { LitElement, css, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import './product-tile';
import { getRecommender } from './util/recommender';
import { getProductRecommendationBuilderWithDefaults } from './initialize';

export class PopularProducts extends LitElement {

    @property({ type: Number })
    sinceMinutesAgo: number = 20160; // 14 days

    @property({ type: Number })
    numberOfRecommendations: number = 5;

    @property()
    basedOn: 'MostPurchased' | 'MostViewed' = 'MostPurchased';

    @state()
    products: ProductResult[] | null = null;

    connectedCallback(): void {
        super.connectedCallback();
        this.fetchProducts();
    }

    render() {
        if (this.products) {
            return html`<div class="grid">
                ${this.products.map(product =>
                    html`<relewise-product-tile .product=${product}></relewise-product-tile>`)
                }
            </div>`
        }
    }

    async fetchProducts() {
        const recommender = getRecommender();
        const builder = getProductRecommendationBuilderWithDefaults<PopularProductsBuilder>(settings => new PopularProductsBuilder(settings))
            .sinceMinutesAgo(this.sinceMinutesAgo)
            .basedOn(this.basedOn)
            .setNumberOfRecommendations(this.numberOfRecommendations);

        const result = await recommender.recommendPopularProducts(builder.build());
        this.products = result?.recommendations ?? null;
    }

    static styles = css`
        .grid {
            display: grid;
            grid-template-columns: var(--relewise-grid-template-columns, repeat(5,1fr));
            gap: .75rem;
            grid-auto-rows: 1fr;
        }

        @media screen and (max-width:768px) {
            .grid {
                grid-template-columns:var(--relewise-mobile-grid-template-columns, repeat(2,1fr));
            }
        }`;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-popular-products': PopularProducts;
    }
}