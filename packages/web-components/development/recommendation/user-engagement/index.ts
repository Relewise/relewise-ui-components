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
        localization: {
            // showcase user engagement localizations in Danish
            favoriteButton: {
                addToFavorites: 'Tilføj til favoritter',
                removeFavorite: 'Fjern favorit',
            },
            sentimentButtons: {
                like: 'Synes godt om',
                removeLike: 'Fjern synes godt om',
                dislike: 'Synes ikke om',
                removeDislike: 'Fjern synes ikke om',
            },
        },
        userEngagement: {
            product: {
                favorite: true,
                sentiment: true,
            },
            content: {
                favorite: true,
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
