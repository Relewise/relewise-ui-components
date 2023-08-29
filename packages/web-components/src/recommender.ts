import { Recommender } from '@relewise/client';
import { getRelewiseSettings } from './relewise';

export function getRecommender() {
    const settings = getRelewiseSettings();
    return new Recommender(settings.datasetId, settings.apiKey, settings.clientOptions);
}