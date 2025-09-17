import { SelectedCategoryPropertiesSettings, SelectedProductPropertiesSettings } from '@relewise/client';

export const defaultProductProperties: Partial<SelectedProductPropertiesSettings> = {
    displayName: true,
    pricing: true,
    dataKeys: ['ImageUrl', 'Url', 'relewise*'],
};

export const defaultProductCategoryProperties: Partial<SelectedCategoryPropertiesSettings> = {
    displayName: true,
    dataKeys: ['Url'],
};

export const defaultExplodedVariants = 1;