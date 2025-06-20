import { ContextSettings } from './initialize';
import { Events, getRelewiseNamedFilters } from './helpers';
import { FilterBuilder } from '@relewise/client';

export function updateContextSettings(contextSettings: Partial<ContextSettings>) {

    if (contextSettings.getUser) {
        window.relewiseUIOptions.contextSettings.getUser = contextSettings.getUser;
    }

    if (contextSettings.currency) {
        window.relewiseUIOptions.contextSettings.currency = contextSettings.currency;
    }

    if (contextSettings.language) {
        window.relewiseUIOptions.contextSettings.language = contextSettings.language;
    }

    const relewiseContextSettingsUpdatedEvent = new CustomEvent(Events.contextSettingsUpdated);
    window.dispatchEvent(relewiseContextSettingsUpdatedEvent);
}

export function addNamedFilter(options: {
        name: string;
        builder: (builder: FilterBuilder) => void;
    }) {

    const namedFilters = getRelewiseNamedFilters();

    namedFilters.add(options);
}