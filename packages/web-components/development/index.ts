import { UserFactory } from '@relewise/client';
import { initializeRelewiseUI, updateContextSettings } from '../src/index';

const relewise = initializeRelewiseUI(
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
);

relewise
    .useRecommendations();

// Wait for 3 seconds and then call updateRelewiseContextSettings
setTimeout(() => {
    updateContextSettings({
        language: 'fr-be',
        currency: 'EUR',
    });
}, 3000); // 3000 milliseconds = 3 seconds