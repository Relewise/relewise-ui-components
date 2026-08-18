/// <reference types="vite/client" />

import { UserFactory } from '@relewise/client';
import {
    initializeRelewiseUI,
    Events,
    PopularSearchTerms,
    PopularSearchTermSelectedEventDetail,
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
}).useRecommendations({
    popularSearchTerms: {
        targetEntityTypes: ['Product', 'ProductCategory', 'Content'],
    },
});

const popularSearchTerms = document.querySelector<PopularSearchTerms>('#popular-search-terms-example');
popularSearchTerms?.addEventListener(Events.popularSearchTermSelected, event => {
    const term = (event as CustomEvent<PopularSearchTermSelectedEventDetail>).detail.term;
    console.log('Selected popular search term:', term);
});
