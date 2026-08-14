/// <reference types="vite/client" />

import { UserFactory } from '@relewise/client';
import { initializeRelewiseUI, RecommendationBlocks } from '../../../src';

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
    selectedPropertiesSettings: {
        product: {
            displayName: true,
            pricing: true,
            dataKeys: ['Url', 'ImageUrl'],
        },
        productCategory: {
            displayName: true,
            dataKeys: ['Url', 'ImageUrl'],
        },
        content: {
            displayName: true,
            dataKeys: ['Url', 'ImageUrl'],
        },
    },
}).useRecommendations();

const recommendationBlocks = document.querySelector<RecommendationBlocks>('relewise-recommendation-blocks');
if (recommendationBlocks) {
    recommendationBlocks.blocks = [
        { type: 'PopularProducts', title: 'Popular products', take: 10 },
        { type: 'PopularProductCategories', title: 'Popular categories', take: 6 },
        { type: 'PopularContents', title: 'Popular content', take: 10 },
        { type: 'PopularSearchTerms', title: 'Popular searches', take: 8 },
    ];
    recommendationBlocks.targetEntityTypes = ['Product', 'ProductCategory', 'Content'];
}
