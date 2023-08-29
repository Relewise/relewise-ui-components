import { PopularProductsBuilder, ProductResult } from '@relewise/client';
import { LitElement, html } from 'lit';
import { state } from 'lit/decorators.js';
import { getRecommender } from './recommender';
import { getRelewiseBuilderSettings, getRelewiseUISettings } from './relewiseUI';

export class PopularProducts extends LitElement {

    @state()
        products: ProductResult[] | null = null;

    async fetchProducts() {
        const relewiseUISettings = getRelewiseUISettings();
        console.log(relewiseUISettings.selectedPropertiesSettings?.product);
        const recommender = getRecommender();
        const builder = new PopularProductsBuilder(getRelewiseBuilderSettings()).sinceMinutesAgo(1).basedOn('MostPurchased')
            .setSelectedProductProperties(relewiseUISettings.selectedPropertiesSettings?.product ?? {}); // TODO: find a better way to handle no selected properties when implementing this element!
        
        const result = await recommender.recommendPopularProducts(builder.build());
        this.products = result?.recommendations ?? null;
    }
    
    connectedCallback(): void {
        super.connectedCallback();
        this.fetchProducts();        
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