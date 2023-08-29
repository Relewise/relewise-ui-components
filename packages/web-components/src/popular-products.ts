import { PopularProductsBuilder, ProductResult } from '@relewise/client';
import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { getRecommender } from './recommender';
import { getRelewiseBuilderSettings } from './relewise';

@customElement('relewise-popular-products')
export class PopularProducts extends LitElement {

    @state()
        products: ProductResult[] | null = null;

    async fetchProducts() {
        const recommender = getRecommender();
        const builder = new PopularProductsBuilder(getRelewiseBuilderSettings())
            .setSelectedProductProperties(window.relewiseSettings.selectedProductPropertiesSettings);
        
        const result = await recommender.recommendPopularProducts(builder.build());
        this.products = result?.recommendations ?? null;
    }
    
    connectedCallback(): void {
        super.connectedCallback();
        this.addEventListener('relewise-ui-initialized', () => {
            this.fetchProducts();        
        })
    }

    render() {
        if(this.products) {
            return this.products.map(product => 
                html`<h1>${product.displayName}</h1>`,
            )
        } else {
            return html`<h1>Loading...</h1>`
        }
    }
}

declare global {
    interface HTMLElementTagNameMap {
      'relewise-popular-products': PopularProducts;
    }
  }