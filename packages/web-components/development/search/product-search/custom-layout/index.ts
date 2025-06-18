/// <reference types="vite/client" />

import { UserFactory } from '@relewise/client';
import { addFilterTemplate, initializeRelewiseUI } from '../../../../src/index';

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
        filters: {
            productTemplates(b) {
                b.addTemplate({ name: 'test', builder: (b) => b.addProductCategoryIdFilter('ImmediateParent', 'f-1') });
                b.addTemplate({ name: 'test2', builder: (b) => b.addProductCategoryIdFilter('ImmediateParent', 'f-1') });
            },
        },
    },
)
    .useSearch({
        facets: {
            product(builder) {
                builder
                    .addFacet((f) => f.addBrandFacet(), { heading: 'Mærke' })
                    .addFacet((f) => f.addCategoryFacet('ImmediateParent'), { heading: 'Kategori' })
                    .addFacet((f) => f.addSalesPriceRangeFacet('Product'), { heading: 'Salgs pris' });
            },
        },
    });
addFilterTemplate({ name: 'plp', builder: (b) => b.addProductCategoryIdFilter('ImmediateParent', 'f-1')});