import { ProductCategorySearchBuilder } from '@relewise/client';
import { defaultProductCategoryProperties } from '../defaultSettings';
import { getRelewiseContextSettings, getRelewiseUIOptions, getRelewiseUISearchOptions } from '../helpers';

export function createProductCategorySearchBuilder(searchTerm: string | null | undefined, displayedAtLocation: string): ProductCategorySearchBuilder {
    const relewiseUIOptions = getRelewiseUIOptions();
    const searchOptions = getRelewiseUISearchOptions();
    const settings = getRelewiseContextSettings(displayedAtLocation);

    return new ProductCategorySearchBuilder(settings)
        .setSelectedCategoryProperties(relewiseUIOptions.selectedPropertiesSettings?.productCategory ?? defaultProductCategoryProperties)
        .setTerm(searchTerm ? searchTerm : null)
        .relevanceModifiers(builder => {
            if (relewiseUIOptions.relevanceModifiers?.productCategory) {
                relewiseUIOptions.relevanceModifiers.productCategory(builder);
            }
        })
        .filters(builder => {
            if (relewiseUIOptions.filters?.productCategory) {
                relewiseUIOptions.filters.productCategory(builder);
            }
            if (searchOptions && searchOptions.filters?.productCategory) {
                searchOptions.filters.productCategory(builder);
            }
        });
}