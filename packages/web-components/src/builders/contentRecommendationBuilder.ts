import { ContentSettingsRecommendationBuilder, Settings } from '@relewise/client';
import { getRelewiseContextSettings, getRelewiseRecommendationTargetedConfigurations, getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { defaultContentProperties } from '../defaultSettings';

export async function getContentRecommendationBuilderWithDefaults<T extends ContentSettingsRecommendationBuilder>(createBuilder: (settings: Settings) => T, displayedAtLocation: string, target?: string | null): Promise<T> {
    const settings = getRelewiseContextSettings(displayedAtLocation);
    const relewiseUIOptions = getRelewiseUIOptions();
    const targetedConfiguration = getRelewiseRecommendationTargetedConfigurations();

    // We wait here if the configuration is injected via the global register-method
    if (target && !targetedConfiguration.has(target)) {
        await new Promise(r => setTimeout(r, 0));
    }

    const builder = createBuilder(settings)
        .setSelectedContentProperties(relewiseUIOptions.selectedPropertiesSettings?.content ?? defaultContentProperties)
        .relevanceModifiers(builder => {
            if (relewiseUIOptions.relevanceModifiers?.product) {
                relewiseUIOptions.relevanceModifiers.product(builder);
            }
        })
        .filters(builder => {
            if (relewiseUIOptions.filters?.product) {
                relewiseUIOptions.filters.product(builder);
            }
        });

    if (target) {
        targetedConfiguration.handle(target, builder);
    } 

    return builder;
}