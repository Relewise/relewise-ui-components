import { ProductSettingsRecommendationBuilder, Settings } from '@relewise/client';
import { getRelewiseContextSettings, getRelewiseRecommendationTargetedConfigurations, getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { getSelectedProductProperties } from '../defaultSettings';

export async function getProductRecommendationBuilderWithDefaults<T extends ProductSettingsRecommendationBuilder>(createBuilder: (settings: Settings) => T, displayedAtLocation: string, target?: string | null): Promise<T> {
    // Allow integrators a single tick to inject additional filters before the first request runs.
    await new Promise(r => setTimeout(r, 0));

    const settings = getRelewiseContextSettings(displayedAtLocation);
    const relewiseUIOptions = getRelewiseUIOptions();
    const targetedConfiguration = getRelewiseRecommendationTargetedConfigurations();

    const builder = createBuilder(settings)
        .setSelectedProductProperties(getSelectedProductProperties(relewiseUIOptions))
        .setSelectedVariantProperties(relewiseUIOptions.selectedPropertiesSettings?.variant ?? null)
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