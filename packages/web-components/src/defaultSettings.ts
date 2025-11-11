import { SelectedCategoryPropertiesSettings, SelectedContentPropertiesSettings, SelectedProductPropertiesSettings } from '@relewise/client';
import { RelewiseUIOptions } from './initialize';

export const defaultProductProperties: Partial<SelectedProductPropertiesSettings> = {
    displayName: true,
    pricing: true,
    dataKeys: ['Image', 'Url'],
};

export const defaultProductCategoryProperties: Partial<SelectedCategoryPropertiesSettings> = {
    displayName: true,
    dataKeys: ['Url'],
};

export const defaultContentProperties: Partial<SelectedContentPropertiesSettings> = {
    displayName: true,
    dataKeys: ['Url', 'ImageUrl', 'Summary'],
};

export const defaultExplodedVariants = 1;

export function resolveProductProperties(options: RelewiseUIOptions): Partial<SelectedProductPropertiesSettings> {
    const base = options.selectedPropertiesSettings?.product ?? defaultProductProperties;
    const engagementOptions = options.userEngagement?.product;
    const includeEngagement = Boolean(engagementOptions?.sentiment || engagementOptions?.favorite);

    if (!includeEngagement) {
        return base;
    }

    return {
        ...base,
        userEngagement: true,
    };
}

export function resolveContentProperties(options: RelewiseUIOptions): Partial<SelectedContentPropertiesSettings> {
    const base = options.selectedPropertiesSettings?.content ?? defaultContentProperties;
    const engagementOptions = options.userEngagement?.content;
    const includeEngagement = Boolean(engagementOptions?.sentiment || engagementOptions?.favorite);

    if (!includeEngagement) {
        return base;
    }

    return {
        ...base,
        userEngagement: true,
    };
}
