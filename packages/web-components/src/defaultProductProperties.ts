import { SelectedProductPropertiesSettings } from '@relewise/client';

export const defaultProductProperties: Partial<SelectedProductPropertiesSettings> = {
    displayName: true,
    pricing: true,
    dataKeys: ['ImageUrl', 'Url'],
};