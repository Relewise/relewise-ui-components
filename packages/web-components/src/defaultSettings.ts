import { SelectedCategoryPropertiesSettings, SelectedProductPropertiesSettings } from '@relewise/client';

export const defaultProductProperties: Partial<SelectedProductPropertiesSettings> = {
    displayName: true,
    pricing: true,
    dataKeys: ['ImageUrl', 'Url'],
};

export const defaultProductCategoryProperties: Partial<SelectedCategoryPropertiesSettings> = {
    displayName: true,
    dataKeys: ['Url'],
};

export const defaultContentProperties: Partial<SelectedCategoryPropertiesSettings> = {
    displayName: true,
    dataKeys: ['Url', 'Image'],
};

export const defaultExplodedVariants = 1;