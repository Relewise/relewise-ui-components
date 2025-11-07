/// <reference types="vite/client" />

import { ProductResult, UserFactory } from '@relewise/client';
import { initializeRelewiseUI, ProductTemplateExtensions } from '../../../src/index';

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
        selectedPropertiesSettings: {
            product: {
                displayName: true,
                pricing: true,
                allData: true,
            },
        },
        templates: {
            product: (product: ProductResult, { html, helpers }: ProductTemplateExtensions) => {
                const { formatPrice, nothing } = helpers;
                const image = product.data && 'ImageUrl' in product.data ? product.data['ImageUrl'].value : null;
                const productImageAlt = product.displayName ?? 'Product image';

                return html`
                    <style>
                        .rw-object-cover {
                            height: 20em !important;
                        }
                    </style>
                    <div class="rw-tile">
                    ${image ? 
                        html`<div class="rw-image-container">
                            <img
                            class="rw-object-cover"
                            src=${image}
                            alt=${productImageAlt}
                            />
                        </div>`
                        : nothing}
                    <div class="rw-information-container">
                        <h5 class="rw-display-name">${product.displayName}</h5>
                        <div class="rw-price">
                        <span>${formatPrice(product.salesPrice)}</span>
                        ${(product.salesPrice && product.listPrice && product.listPrice !== product.salesPrice) ? html`<span class="rw-list-price">${formatPrice(product.listPrice)}</span>` : nothing}
                        </div>
                    </div>
                    </div>
                `;
            },
        },
    },
).useRecommendations();