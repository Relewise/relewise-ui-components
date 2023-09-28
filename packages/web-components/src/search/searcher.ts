import { Searcher } from '@relewise/client';
import { RelewiseUIOptions } from '../initialize';

export function getSearcher(options: RelewiseUIOptions): Searcher {

    return new Searcher(
        options.datasetId, 
        options.apiKey, 
        options.clientOptions);
}