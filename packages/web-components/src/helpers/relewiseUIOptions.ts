import { Settings } from '@relewise/client';
import { RelewiseUIOptions } from '../initialize';
import { RelewiseUISearchOptions } from '../app';

let options: RelewiseUIOptions | null = null;
let searchOptions: RelewiseUISearchOptions | null | undefined;

export function setOptions(opt: RelewiseUIOptions) {
    options = opt;
}

export function setSearchOptions(opt: RelewiseUISearchOptions) {
    searchOptions = opt;
}

export function getRelewiseUIOptions(): RelewiseUIOptions {
    if (!options ||
        !options.datasetId ||
        !options.apiKey ||
        !options.contextSettings) {
        throw new Error('Relewise UI not correctly configured');
    }

    return options;
}

export function getRelewiseUISearchOptions(): RelewiseUISearchOptions | null | undefined {
    return searchOptions;
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