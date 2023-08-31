import { Recommender } from '@relewise/client';
import { getRelewiseUISettings } from '../initialize';

export function getRecommender() {
    const settings = getRelewiseUISettings();
    return new Recommender(settings.datasetId, settings.apiKey, settings.clientOptions);
}