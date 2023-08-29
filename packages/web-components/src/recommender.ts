import { Recommender } from '@relewise/client';
import { getRelewiseUISettings } from './relewiseUI';

export function getRecommender() {
    const settings = getRelewiseUISettings();
    return new Recommender(settings.datasetId, settings.apiKey, settings.clientOptions);
}