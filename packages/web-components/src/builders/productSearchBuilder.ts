import { ProductSearchBuilder } from '@relewise/client';
import { defaultExplodedVariants, resolveProductProperties } from '../defaultSettings';
import { getRelewiseContextSettings, getRelewiseUIOptions, getRelewiseUISearchOptions } from '../helpers';

export function createProductSearchBuilder(searchTerm: string | null | undefined, displayedAtLocation: string): ProductSearchBuilder {
    const relewiseUIOptions = getRelewiseUIOptions();
    const searchOptions = getRelewiseUISearchOptions();
    const settings = getRelewiseContextSettings(displayedAtLocation);

    return new ProductSearchBuilder(settings)
        .setSelectedProductProperties(resolveProductProperties(relewiseUIOptions))
        .setSelectedVariantProperties(relewiseUIOptions.selectedPropertiesSettings?.variant ?? null)
        .setExplodedVariants(searchOptions?.explodedVariants ?? defaultExplodedVariants)
        .setTerm(searchTerm ? searchTerm : null)
        .relevanceModifiers(builder => {
            if (relewiseUIOptions.relevanceModifiers?.product) {
                relewiseUIOptions.relevanceModifiers.product(builder);
            }
        })
        .filters(builder => {
            if (relewiseUIOptions.filters?.product) {
                relewiseUIOptions.filters.product(builder);
            }
            if (searchOptions && searchOptions.filters?.product) {
                searchOptions.filters.product(builder);
            }
        });
}