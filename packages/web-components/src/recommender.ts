import { Recommender } from '@relewise/client';

export function getRecommender() {
    return new Recommender(window.relewiseSettings.datasetId, window.relewiseSettings.apiKey);
}