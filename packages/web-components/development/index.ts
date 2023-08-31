import { UserFactory } from '@relewise/client';
import { initializeRelewiseUI } from '../src/index';

initializeRelewiseUI(
    {
        contextSettings: {
            getUser: () => {
                return UserFactory.anonymous();
            },
            language: 'da',
            currency: 'DKK',
            displayedAtLocation: 'Relewise Demo Store',
        },
        datasetId: import.meta.env.VITE_DATASET_ID,
        apiKey: import.meta.env.VITE_API_KEY,
        clientOptions: {
            serverUrl: 'https://sandbox-api.relewise.com/',
        },
    },
);