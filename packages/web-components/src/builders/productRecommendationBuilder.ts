import { ProductSettingsRecommendationBuilder, Settings, SelectedProductPropertiesSettings } from '@relewise/client';
import { getRelewiseContextSettings, getRelewiseUIOptions } from '..';

export function getProductRecommendationBuilderWithDefaults<T extends ProductSettingsRecommendationBuilder>(createBuilder: (settings: Settings) => T): T {
    const settings = getRelewiseContextSettings();
    const defaultProductProperties: Partial<SelectedProductPropertiesSettings> = {
        displayName: true,
        pricing: true,
        dataKeys: ['ImageUrl', 'Url'],
    };

    return createBuilder(settings)
        .setSelectedProductProperties(getRelewiseUIOptions().selectedPropertiesSettings?.product ?? defaultProductProperties);
}