import { Tracker } from '@relewise/client';
import { RelewiseUIOptions } from 'src/initialize';

export function getTracker(options: RelewiseUIOptions): Tracker {
    return new Tracker(
        options.datasetId,
        options.apiKey,
        options.clientOptions,
    );
}