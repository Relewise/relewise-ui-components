import { PopularProductsBuilder, ProductResult } from '@relewise/client';
import { LitElement, html } from 'lit';
import { property } from 'lit/decorators.js';
import { getRecommender } from './recommender';

export class PopularProducts extends LitElement {
    @property({attribute: false})
        products: ProductResult[] = []

    fetchProducts() {
        const recommender = getRecommender();
        const builder = new PopularProductsBuilder(window.relewiseSettings.settings)
            .setSelectedProductProperties(window.relewiseSettings.selectedProductPropertiesSettings);
      
        recommender
            .recommendPopularProducts(builder.build())
            .then(result => {
                if(result?.recommendations) {
                    this.products = result.recommendations;    
                }
            })
    }
    
    connectedCallback(): void {
        super.connectedCallback();
        this.fetchProducts();        
    }

    render() {
        if(this.products.length > 0) {
            return this.products.map(product => 
                html`<h1>${product.displayName}</h1>`,
            )
        } else {
            return html`<h1>Loading...</h1>`
        }
    }
}