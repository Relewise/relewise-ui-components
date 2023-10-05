import { UserFactory } from '@relewise/client';
import { initializeRelewiseUI } from '../src/index';

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
).useRecommendations().useSearch({
    filters: {
        productSearch: (builder) => {
            builder
                .addProductCategoryIdFilter('ImmediateParent', ['category'])
                .addBrandIdFilter(['brand1', 'brand2'])
                .addProductAssortmentFilter(1);
        },
    },
    templates: {
        searchOverlayProductResult: (product, { html, helpers }) => {
            return html`<!-- Write your template here -->`;
        },
    },
});