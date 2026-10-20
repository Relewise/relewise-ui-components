/// <reference types="vite/client" />

import { UserFactory } from '@relewise/client';
import { initializeRelewiseUI, registerRecommendationTarget } from '../../../src/index';

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
        getContextValues: async () => ({
            PageId: '1',
        }),
    },
).useRecommendations({
    getContextValues: async () => ({
        Device: 'Mobile',
    }),
});

registerRecommendationTarget('block', {
    getContextValues: async () => ({
        Block: 'ABC',
    }),
});
