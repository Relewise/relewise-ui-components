import { Tracker } from '@relewise/client';
import { RelewiseUIOptions } from '../initialize';

export function getTracker(options: RelewiseUIOptions): Tracker {
    return new Tracker(
        options.datasetId,
        options.apiKey,
        options.clientOptions,
    );
}