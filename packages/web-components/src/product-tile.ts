import { ProductResult } from '@relewise/client';
import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import renderPrice from './util/price';

@customElement('relewise-product-tile')
export class ProductTile extends LitElement {

    @property({ type: Object })
    product: ProductResult | null = null;


    connectedCallback(): void {
        super.connectedCallback();
        console.log(this.product)
    }

    static styles = css`
        a {
            color: #212427;
        }

        .tile {
            border-radius: .25rem;
            display: flex;
            flex-direction: column;
            position: relative;
            text-decoration: inherit;
            text-size-adjust: none;
            height: 100%;
            font-family: Arial, Helvetica, sans-serif;
        }
        
        img {
            max-width: 100%;
            height: auto;
            padding: .25rem
        }

        .image-container {
            justify-content: center;
            display: flex;
            position: relative;
            margin: .75rem;
        }

        .information-container {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
            text-align: left;
            position: relative;
        }

        .object-cover {
            object-fit: cover;
        }

        .price {
            line-height: 1;
            font-weight: 600;
            font-size: 1.5rem;
            align-items: center;
            display: flex;
        }

        .display-name {
            letter-spacing: -0.025rem;
            line-height: 1.25;
            font-weight: 600;
            font-size: 1.25rem;
            margin-top: 0rem;
            margin-bottom: 0rem;
            white-space: normal;
        }

        .brand {
            font-size: 1rem;
            font-weight: 300;
            line-height: 1.25rem;
            color: darkgray;
        }

        .line-through {
            font-size: 1rem;
            text-decoration: line-through;
            color: darkgray;
            margin: .25rem;
        }
    `;

    render() {
        if (this.product && this.product.data && this.product.data['Url']) {
            return html`
                <a class='tile' href=${this.product.data['Url'].value ?? ''}>
                    ${(this.product.data && 'ImageUrl' in this.product.data) ?
                        html`<div class="image-container"><img class="object-cover" src=${this.product.data['ImageUrl'].value} /></div>` :
                        nothing
                    }
                    <div class='information-container'>
                        <h5 class="display-name">${this.product.displayName}</h5>
                        <div class='price'><p><span>${renderPrice(this.product.salesPrice)}</span></p> ${(this.product.salesPrice &&
                            this.product.listPrice &&
                            this.product.listPrice === this.product.salesPrice) ?
                            
                            html`<span class='line-through'>${renderPrice(this.product.listPrice)}</span>` :
                            nothing
                        }</div>
                    </div>
                </a>
            `;
        }

    }
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-tile': ProductTile;
    }
}