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
}).useRecommendations();

const popularSearchTerms = document.createElement('relewise-popular-search-terms') as PopularSearchTerms;
popularSearchTerms.displayedAtLocation = 'Popular Search Terms development';
popularSearchTerms.numberOfRecommendations = 10;
popularSearchTerms.targetEntityTypes = ['Product', 'ProductCategory', 'Content'];
popularSearchTerms.addEventListener(PopularSearchTermsEvents.termSelected, event => {
    const term = (event as CustomEvent<PopularSearchTermsTermSelectedEventDetail>).detail.term;
    console.log('Selected popular search term:', term);
});
document.querySelector('#popular-search-terms-example')?.append(popularSearchTerms);
