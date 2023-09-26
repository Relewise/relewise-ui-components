import { UserFactory } from '@relewise/client';
import { initializeRelewiseUI, updateContextSettings, useBehavioralTracking } from '../src/index';

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
).useRecommendations();

useBehavioralTracking();

// Wait for 3 seconds and then call updateRelewiseContextSettings
setTimeout(() => {
    updateContextSettings({
        language: 'fr-be',
        currency: 'EUR',
    });
}, 3000); // 3000 milliseconds = 3 seconds