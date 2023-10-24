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
    facets: {
        facetBuilder(builder) {
            builder
                .addCategoryFacet('ImmediateParent')
                .addBrandFacet()
                .addProductDataStringValueFacet('Serie', 'Product')
                .addProductDataStringValueFacet('Color', 'Product')
                .addProductDataBooleanValueFacet('InStock', 'Product')
                .addSalesPriceRangeFacet('Product');
        },
    },
});