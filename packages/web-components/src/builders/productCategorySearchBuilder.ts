import { ProductCategorySearchBuilder, Settings } from '@relewise/client';
import { defaultProductCategoryProperties } from '../defaultSettings';
import { getRelewiseUIOptions, getRelewiseUISearchOptions } from '../helpers';
import { resolveContextValues } from '../helpers/contextValues';

export async function createProductCategorySearchBuilder(searchTerm: string | null | undefined, settings: Settings): Promise<ProductCategorySearchBuilder> {
    const relewiseUIOptions = getRelewiseUIOptions();
    const searchOptions = getRelewiseUISearchOptions();
    const contextValues = await resolveContextValues(
        relewiseUIOptions.getContextValues,
        searchOptions?.getContextValues,
    );

    return new ProductCategorySearchBuilder(settings)
        .contextValues(contextValues)
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
