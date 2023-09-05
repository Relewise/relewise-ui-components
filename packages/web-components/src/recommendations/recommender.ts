import { Recommender } from '@relewise/client';
import { RelewiseUIOptions } from '..';

export function getRecommender(options: RelewiseUIOptions) {
    return new Recommender(
        options.datasetId, 
        options.apiKey, 
        options.clientOptions);
}