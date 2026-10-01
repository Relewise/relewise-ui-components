/// <reference types="vite/client" />

import { Recommender, UserFactory } from '@relewise/client';
import { initializeRelewiseUI } from '../../../../src/index';

// Use fixed terms so the before-results slot is visible without live recommendation data.
const terms = ['Running shoes', 'Summer dresses', 'Hiking boots', 'Rain jackets', 'Sunglasses'];

Recommender.prototype.recommendPopularSearchTerms = async request => ({
    recommendations: terms
        .slice(0, request.settings?.numberOfRecommendations)
        .map((term, index) => ({ term, rank: index + 1 })),
});

initializeRelewiseUI({
    contextSettings: {
        getUser: () => UserFactory.anonymous(),
        language: import.meta.env.VITE_LANGUAGE,
        currency: import.meta.env.VITE_CURRENCY,
    },
    datasetId: import.meta.env.VITE_DATASET_ID,
    apiKey: import.meta.env.VITE_API_KEY,
    clientOptions: {
        serverUrl: import.meta.env.VITE_SERVER_URL,
    },
    components: {
        domMode: 'light',
    },
}).useRecommendations({
    popularSearchTerms: {
        targetEntityTypes: ['Product', 'ProductCategory', 'Content'],
    },
});
