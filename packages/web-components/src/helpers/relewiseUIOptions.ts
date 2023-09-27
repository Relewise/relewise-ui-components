import { Settings } from '@relewise/client';
import { RelewiseUIOptions } from '../initialize';

export function getRelewiseUIOptions(): RelewiseUIOptions {
    const options = window.relewiseUIOptions;

    if (!options ||
        !options.datasetId ||
        !options.apiKey ||
        !options.contextSettings) {
        throw new Error('Relewise UI not correctly configured');
    }

    return options;
}

export function getRelewiseContextSettings(displayedAtLocation: string): Settings {
    const contextSettings = getRelewiseUIOptions().contextSettings;

    return {
        currency: contextSettings.currency,
        displayedAtLocation: displayedAtLocation,
        language: contextSettings.language,
        user: contextSettings.getUser(),
    };
}