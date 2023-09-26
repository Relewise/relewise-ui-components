import { ProductRecommendationResponse, ProductResult } from '@relewise/client';
import { LitElement, css, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events } from '../../helpers/events';

export abstract class ProductRecommendationBase extends LitElement {

    abstract fetchProducts(): Promise<ProductRecommendationResponse | undefined> | undefined;
    
    @property({ type: Number, attribute: 'number-of-recommendations' })
    numberOfRecommendations: number = 4;

    @property({attribute: 'displayed-at-location'})
    displayedAtLocation?: string = undefined;

    @state()
    products: ProductResult[] | null = null;

    async connectedCallback() {
        super.connectedCallback();
        if (!this.displayedAtLocation) {
            console.error('No displayedAtLocation defined!');
        }

        const fetchAndUpdateProducts = async() => {
            const result = await this.fetchProducts();
            this.products = result?.recommendations ?? null;
        };

        await fetchAndUpdateProducts();

        window.addEventListener(Events.contextSettingsUpdated, fetchAndUpdateProducts);
    }

    render() {
        if (this.products) {
            return html`<div class="rw-grid">
                ${this.products.map(product =>
                    html`<relewise-product-tile .product=${product}></relewise-product-tile>`)
                }
            </div>`
        }
    }

    static styles = css`
        .rw-grid {
            display: grid;
            grid-template-columns: var(--relewise-grid-template-columns, repeat(4,1fr));
            gap: var(--relewise-grid-gap, 1rem);
            grid-auto-rows: 1fr;
        }

        @media (max-width: 768px) {
            .rw-grid {
                grid-template-columns:var(--relewise-mobile-grid-template-columns, repeat(2,1fr));
            }
        }`;
}