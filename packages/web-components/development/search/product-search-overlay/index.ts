/// <reference types="vite/client" />

import { UserFactory } from '@relewise/client';
import { initializeRelewiseUI } from '../../../src/index';

initializeRelewiseUI(
    {
        contextSettings: {
            getUser: () => {
                return UserFactory.anonymous();
            },
            language: import.meta.env.VITE_LANGUAGE,
            currency: import.meta.env.VITE_CURRENCY,
        },
        datasetId: import.meta.env.VITE_DATASET_ID,
        apiKey: import.meta.env.VITE_API_KEY,
        clientOptions: {
            serverUrl: import.meta.env.VITE_SERVER_URL,
        },
    },
).useSearch({
    localization: {
        searchResults: {
            noResults: 'Vi fandt ikke noget',
            showAllResults: 'Se alle resultater',
        },
    },
    explodedVariants: 1,
    // templates: {
    //     searchOverlayProductCategoryResult: (category, { html, helpers }) => {

    //         return html`
    //             <a class="rw-tile" href="https://dr.dk/products/${category.data[`Handle`].value}">
    //                 <h4 class="rw-product-category-result-display-name">${category.displayName}</h4>

    //                 </div>
    //             </a>`;
    //     },
    //     searchOverlayProductResult: (product, { html, helpers }) => {

    //         return html`
    //             <a class="rw-tile" href="https://dr.dk/products/${product.data[`relewise-demo-store.myshopify.com_ShopifyHandle`].value}">
    //                 <img class="rw-product-image-container" src=${product.data[`relewise-demo-store.myshopify.com_ImageUrls`].value.$values[0]}/>
    //                 <h4 class="rw-product-result-display-name">${product.displayName}</h4>
    //                 <div class="rw-product-result-price">
    //                     <span class="rw-product-result-sales-price">${helpers.formatPrice(product.salesPrice)}</span>
    //                     ${product.salesPrice && product.listPrice && product.listPrice !== product.salesPrice
    //                 ? html`<span class="rw-product-result-list-price">${helpers.formatPrice(product.listPrice)}</span>`
    //                 : ''}
    //                 </div>
    //             </a>`;
    //     },
    //},
});