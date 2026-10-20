import { ContentSettingsRecommendationBuilder, Settings } from '@relewise/client';
import { resolveContextValues } from '../helpers/contextValues';
import { getRelewiseContextSettings, getRelewiseRecommendationTargetedConfigurations, getRelewiseUIOptions, getRelewiseUIRecommendationOptions } from '../helpers/relewiseUIOptions';
import { getSelectedContentProperties } from '../defaultSettings';

export async function getContentRecommendationBuilderWithDefaults<T extends ContentSettingsRecommendationBuilder>(createBuilder: (settings: Settings) => T, displayedAtLocation: string, target?: string | null): Promise<T> {
    // Allow integrators a single tick to inject additional filters before the first request runs.
    await new Promise(r => setTimeout(r, 0));

    const settings = await getRelewiseContextSettings(displayedAtLocation);
    const relewiseUIOptions = getRelewiseUIOptions();
    const recommendationOptions = getRelewiseUIRecommendationOptions();
    const targetedConfiguration = getRelewiseRecommendationTargetedConfigurations();
    const contextValues = await resolveContextValues(
        relewiseUIOptions.getContextValues,
        recommendationOptions?.getContextValues,
    );

    const builder = createBuilder(settings)
        .contextValues(contextValues)
        .setSelectedContentProperties(getSelectedContentProperties(relewiseUIOptions))
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
        await targetedConfiguration.handle(target, builder);
    }

    return builder;
}
