import {
    ContentCategorySettingsRecommendationBuilder,
    ProductCategorySettingsRecommendationBuilder,
    SelectedContentCategoryPropertiesSettings,
    SelectedProductCategoryPropertiesSettings,
    Settings,
} from '@relewise/client';
import {
    getRelewiseContextSettings,
    getRelewiseRecommendationTargetedConfigurations,
    getRelewiseUIOptions,
} from '../helpers/relewiseUIOptions';

const defaultProductCategoryRecommendationProperties: Partial<SelectedProductCategoryPropertiesSettings> = {
    displayName: true,
    dataKeys: ['ImageUrl', 'Url'],
};

const defaultContentCategoryRecommendationProperties: Partial<SelectedContentCategoryPropertiesSettings> = {
    displayName: true,
    dataKeys: ['ImageUrl', 'Url'],
};

export async function getProductCategoryRecommendationBuilderWithDefaults<T extends ProductCategorySettingsRecommendationBuilder>(
    createBuilder: (settings: Settings) => T,
    displayedAtLocation: string,
    target?: string | null,
): Promise<T> {
    await new Promise(resolve => setTimeout(resolve, 0));

    const settings = await getRelewiseContextSettings(displayedAtLocation);
    const options = getRelewiseUIOptions();
    const builder = createBuilder(settings)
        .setProductCategoryProperties(options.selectedPropertiesSettings?.productCategory ?? defaultProductCategoryRecommendationProperties)
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
        .setSelectedContentCategoryProperties(options.selectedPropertiesSettings?.contentCategory ?? defaultContentCategoryRecommendationProperties)
        .relevanceModifiers(modifiers => options.relevanceModifiers?.contentCategory?.(modifiers))
        .filters(filters => options.filters?.contentCategory?.(filters));

    if (target) {
        getRelewiseRecommendationTargetedConfigurations().handle(target, builder);
    }

    return builder;
}
