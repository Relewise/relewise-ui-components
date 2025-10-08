import { ContentSettingsRecommendationBuilder, SelectedContentPropertiesSettings, Settings } from '@relewise/client';
import { getRelewiseContextSettings, getRelewiseRecommendationTargetedConfigurations, getRelewiseUIOptions } from '../helpers/relewiseUIOptions';

export async function getContentRecommendationBuilderWithDefaults<T extends ContentSettingsRecommendationBuilder>(createBuilder: (settings: Settings) => T, displayedAtLocation: string, target?: string | null): Promise<T> {
    const settings = getRelewiseContextSettings(displayedAtLocation);
    const relewiseUIOptions = getRelewiseUIOptions();
    const targetedConfiguration = getRelewiseRecommendationTargetedConfigurations();

    if (target && !targetedConfiguration.has(target)) {
        await new Promise(r => setTimeout(r, 0));
    }

    const builder = createBuilder(settings)
        .setSelectedContentProperties(relewiseUIOptions.selectedPropertiesSettings?.content ?? getDefaultContentProperties());

    // if (target) {
    //     targetedConfiguration.handle(target, builder);
    // }

    return builder;
}

function getDefaultContentProperties(): Partial<SelectedContentPropertiesSettings> {
    return {
        displayName: true,
        dataKeys: ['Image', 'Url', 'Description'],
    };
}
