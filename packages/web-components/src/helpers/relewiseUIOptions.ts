import { Settings } from '@relewise/client';
import { RelewiseUIOptions } from '../initialize';
import { RelewiseUISearchOptions } from '../app';
import { TargetedConfigurations } from '../targetedOptions';

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

export function getRelewiseUISearchOptions(): RelewiseUISearchOptions | undefined {
    return window.relewiseUISearchOptions;
}

export function getRelewiseTargetedOptions(): TargetedConfigurations {
    return window.relewiseUITargetedOptions;
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