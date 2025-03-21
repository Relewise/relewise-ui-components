import { ContextSettings } from './initialize';
import { Events, getRelewiseUIOptions } from './helpers';

export function updateContextSettings(contextSettings: Partial<ContextSettings>) {

    if (contextSettings.getUser) {
        getRelewiseUIOptions().contextSettings.getUser = contextSettings.getUser;
    }

    if (contextSettings.currency) {
        getRelewiseUIOptions().contextSettings.currency = contextSettings.currency;
    }

    if (contextSettings.language) {
        getRelewiseUIOptions().contextSettings.language = contextSettings.language;
    }

    const relewiseContextSettingsUpdatedEvent = new CustomEvent(Events.contextSettingsUpdated);
    window.dispatchEvent(relewiseContextSettingsUpdatedEvent);
}