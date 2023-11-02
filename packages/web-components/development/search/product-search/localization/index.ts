/// <reference types="vite/client" />

import { UserFactory } from '@relewise/client';
import { initializeRelewiseUI } from '../../../../src/index';

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
).useSearch({
    localization: {
        loadMoreButton: {
            loadMore: 'Hent flere!',
        },
        searchBar: {
            placeholder: 'Du kan søge her',
            search: 'Find',
        },
        searchResults: {
            noResults: 'Vi fandt ikke noget',
        },
        sortingButton: {
            alphabeticalAscending: 'a - å',
            alphabeticalDescending: 'å - a',
            popularity: 'populært',
            salesPriceAscending: 'laveste pris først',
            salesPriceDescending: 'højeste pris først',
            sorting: 'Du kan sortere her',
        },
    },
});