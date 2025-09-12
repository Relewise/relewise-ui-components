import { SelectedCategoryPropertiesSettings, SelectedProductPropertiesSettings } from '@relewise/client';

export const defaultProductProperties: Partial<SelectedProductPropertiesSettings> = {
    displayName: true,
    pricing: true,
    dataKeys: ['ImageUrl', 'Url', 'relewise-demo-store.myshopify.com_*'],
};

export const defaultProductCategoryProperties: Partial<SelectedCategoryPropertiesSettings> = {
    displayName: true,
    dataKeys: ['Url', 'Handle'],
};

export const defaultExplodedVariants = 1;