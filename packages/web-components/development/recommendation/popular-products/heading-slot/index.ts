/// <reference types="vite/client" />

import { UserFactory } from '@relewise/client';
import { initializeRelewiseUI, PopularProducts } from '../../../../src';
import { Events } from '../../../../src/helpers/events';
import type { RecommendationStateChangedEventDetail } from '../../../../src/recommendations/recommendation-state';

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

const form = document.querySelector<HTMLFormElement>('#request-form')!;
const takeInput = document.querySelector<HTMLInputElement>('#take')!;
const headingInput = document.querySelector<HTMLInputElement>('#heading-text')!;
const result = document.querySelector<HTMLElement>('#result')!;
const status = document.querySelector<HTMLElement>('#status')!;
let recommendation: PopularProducts | undefined;

form.addEventListener('submit', event => {
    event.preventDefault();
    const take = takeInput.valueAsNumber;
    const headingText = headingInput.value.trim();

    if (!recommendation) {
        const component = document.createElement('relewise-popular-products');
        component.displayedAtLocation = 'Popular Products heading demo';
        component.addEventListener(Events.recommendationStateChanged, event => {
            const state = (event as CustomEvent<RecommendationStateChangedEventDetail>).detail;

            if (state.loading) {
                status.textContent = 'Loading recommendations…';
            } else if (state.hasResults) {
                status.textContent = `${component.products?.length ?? 0} recommendations returned.`;
            } else {
                status.textContent = 'No recommendations returned.';
            }
        });
        recommendation = component;
    }

    recommendation.numberOfRecommendations = take;
    recommendation.querySelector('template[slot="heading"]')?.remove();
    if (headingText) {
        const template = document.createElement('template');
        template.slot = 'heading';
        const heading = document.createElement('h2');
        heading.textContent = headingText;
        template.content.append(heading);
        recommendation.append(template);
    }

    if (recommendation.isConnected) {
        void recommendation.fetchAndUpdateProducts();
    } else {
        result.append(recommendation);
    }
});
