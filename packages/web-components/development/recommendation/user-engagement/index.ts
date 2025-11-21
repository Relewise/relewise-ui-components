/// <reference types="vite/client" />

import { UserFactory } from '@relewise/client';
import { initializeRelewiseUI } from '../../../src/index';

initializeRelewiseUI(
    {
        contextSettings: {
            getUser: () => {
                return UserFactory.byTemporaryId('temp-id');
            },
            language: import.meta.env.VITE_LANGUAGE,
            currency: import.meta.env.VITE_CURRENCY,
        },
        datasetId: import.meta.env.VITE_DATASET_ID,
        apiKey: import.meta.env.VITE_API_KEY,
        clientOptions: {
            serverUrl: import.meta.env.VITE_SERVER_URL,
        },
        userEngagement: {
            product: {
                favorite: true,
            },
            content: {
                sentiment: true,
            },
        },
        targets: {
            searchTargets(builder) {
                builder.add({
                    target: 'farvorites',
                    configuration: {
                        filters: f => f.addProductEngagementFilter({ isFavorite: true }),
                    },
                });
            },
        },
    },
).useRecommendations().useSearch();