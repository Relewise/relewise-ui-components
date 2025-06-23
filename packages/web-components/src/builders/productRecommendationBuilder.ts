import { ProductSettingsRecommendationBuilder, Settings } from '@relewise/client';
import { getRelewiseContextSettings, getRelewiseRecommendationTargetedConfigurations, getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { defaultProductProperties } from '../defaultProductProperties';

export async function getProductRecommendationBuilderWithDefaults<T extends ProductSettingsRecommendationBuilder>(createBuilder: (settings: Settings) => T, displayedAtLocation: string, target?: string | null): Promise<T> {
    const settings = getRelewiseContextSettings(displayedAtLocation ?? '');
    const relewiseUIOptions = getRelewiseUIOptions();
    const targetedConfiguration = getRelewiseRecommendationTargetedConfigurations();

    // We wait here if the configuration is injected via the global register-method
    if (target && !targetedConfiguration.has(target)) {
        await new Promise(r => setTimeout(r, 0));
    }
        
    return createBuilder(settings)
        .setSelectedProductProperties(relewiseUIOptions.selectedPropertiesSettings?.product ?? defaultProductProperties)
        .setSelectedVariantProperties(relewiseUIOptions.selectedPropertiesSettings?.variant ?? null)
        .filters(builder => {
            if (relewiseUIOptions.filters?.product) {
                relewiseUIOptions.filters.product(builder);
            }

            if (target) {
                targetedConfiguration.handleFilters(target, builder);
            }
        });
}