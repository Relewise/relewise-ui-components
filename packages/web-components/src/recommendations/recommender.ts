import { Recommender } from '@relewise/client';
import { getRelewiseUIOptions } from '../initialize';

export function getRecommender() {
    const settings = getRelewiseUIOptions();

    return new Recommender(
        settings.datasetId, 
        settings.apiKey, 
        settings.clientOptions);
}