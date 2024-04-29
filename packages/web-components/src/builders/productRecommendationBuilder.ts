import { ProductSettingsRecommendationBuilder, Settings } from '@relewise/client';
import { getRelewiseContextSettings, getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { defaultProductProperties } from '../defaultProductProperties';

export function getProductRecommendationBuilderWithDefaults<T extends ProductSettingsRecommendationBuilder>(createBuilder: (settings: Settings) => T, displayedAtLocation: string): T {
    const settings = getRelewiseContextSettings(displayedAtLocation ?? '');
    const relewiseUIOptions = getRelewiseUIOptions();

    return createBuilder(settings)
        .setSelectedProductProperties(relewiseUIOptions.selectedPropertiesSettings?.product ?? defaultProductProperties)
        .setSelectedVariantProperties(relewiseUIOptions.selectedPropertiesSettings?.variant ?? null)
        .filters(builder => {
            if (relewiseUIOptions.filters?.product) {
                relewiseUIOptions.filters.product(builder);
            }
        });
}