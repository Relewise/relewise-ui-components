import { UserFactory } from '@relewise/client';
import { initializeRelewiseUI } from '../src/index';

initializeRelewiseUI(
    {
        contextSettings: {
            getUser: (userFactory: UserFactory) => {
                return userFactory.anonymous();
            },
            language: 'da-dk',
            currency: 'DKK',
            displayedAtLocation: 'Relewise Demo Store',
        },
        datasetId: import.meta.env.VITE_DATASET_ID,
        apiKey: import.meta.env.VITE_API_KEY,
        selectedPropertiesSettings: {
            product: {
                displayName: true,
            },
        },
        clientOptions: {
            serverUrl: 'https://api.relewise.com/',
        },
    },
);