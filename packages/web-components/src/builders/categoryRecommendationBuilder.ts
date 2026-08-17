import {
    ContentCategorySettingsRecommendationBuilder,
    ProductCategorySettingsRecommendationBuilder,
    Settings,
} from '@relewise/client';
import { defaultContentCategoryProperties, defaultProductCategoryProperties } from '../defaultSettings';
import {
    getRelewiseContextSettings,
    getRelewiseRecommendationTargetedConfigurations,
    getRelewiseUIOptions,
} from '../helpers/relewiseUIOptions';

export async function getProductCategoryRecommendationBuilderWithDefaults<T extends ProductCategorySettingsRecommendationBuilder>(
    createBuilder: (settings: Settings) => T,
    displayedAtLocation: string,
    target?: string | null,
): Promise<T> {
    await new Promise(resolve => setTimeout(resolve, 0));

    const settings = await getRelewiseContextSettings(displayedAtLocation);
    const options = getRelewiseUIOptions();
    const builder = createBuilder(settings)
        .setProductCategoryProperties(options.selectedPropertiesSettings?.productCategory ?? defaultProductCategoryProperties)
        .relevanceModifiers(modifiers => options.relevanceModifiers?.productCategory?.(modifiers))
        .filters(filters => options.filters?.productCategory?.(filters));

    if (target) {
        getRelewiseRecommendationTargetedConfigurations().handle(target, builder);
    }

    return builder;
}

export async function getContentCategoryRecommendationBuilderWithDefaults<T extends ContentCategorySettingsRecommendationBuilder>(
    createBuilder: (settings: Settings) => T,
    displayedAtLocation: string,
    target?: string | null,
): Promise<T> {
    await new Promise(resolve => setTimeout(resolve, 0));

    const settings = await getRelewiseContextSettings(displayedAtLocation);
    const options = getRelewiseUIOptions();
    const builder = createBuilder(settings)
        .setSelectedContentCategoryProperties(options.selectedPropertiesSettings?.contentCategory ?? defaultContentCategoryProperties)
        .relevanceModifiers(modifiers => options.relevanceModifiers?.contentCategory?.(modifiers))
        .filters(filters => options.filters?.contentCategory?.(filters));

    if (target) {
        getRelewiseRecommendationTargetedConfigurations().handle(target, builder);
    }

    return builder;
}
