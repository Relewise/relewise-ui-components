/// <reference types="vite/client" />

import { UserFactory } from '@relewise/client';
import {
    initializeRelewiseUI,
    PopularSearchTerms,
    PopularSearchTermsEvents,
    PopularSearchTermsTermSelectedEventDetail,
} from '../../../src';

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
    recommendationSettings: {
        popularSearchTerms: {
            targetEntityTypes: ['Product', 'ProductCategory', 'Content'],
        },
    },
}).useRecommendations();

const popularSearchTerms = document.querySelector<PopularSearchTerms>('#popular-search-terms-example');
popularSearchTerms?.addEventListener(PopularSearchTermsEvents.termSelected, event => {
    const term = (event as CustomEvent<PopularSearchTermsTermSelectedEventDetail>).detail.term;
    console.log('Selected popular search term:', term);
});
