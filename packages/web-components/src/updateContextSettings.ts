import { ContextSettings } from 'src/initialize';
import { Events } from './helpers';

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