import { FilterBuilder, ProductSearchBuilder, RelevanceModifierBuilder } from '@relewise/client';
import { QueryKeys, readCurrentUrlState } from './helpers/urlState';
import { RelewiseFacetBuilder } from './facetBuilder';
import { SearchSortingOption, SearchSortingOptionsBuilder, getSearchSortingOptions, getSearchSortingSelection } from './search/searchSortingBuilder';


export type TargetedSearchConfiguration = {
    overwriteFacets?: (builder: RelewiseFacetBuilder) => void,
    overwriteSorting?: (builder: SearchSortingOptionsBuilder) => void,
    filters?: (builder: FilterBuilder) => void;
    relevanceModifiers?: (builder: RelevanceModifierBuilder) => void;
};

export class TargetedSearchConfigurations {

    private templates = new Map<string, TargetedSearchConfiguration>();

    constructor(initialValues?: (builder: TargetedSearchConfigurations) => void) {
        if (initialValues) initialValues(this);
    }

    add(configuration: {
        target: string;
        configuration: TargetedSearchConfiguration;
    }): this {

        this.templates.set(configuration.target, configuration.configuration);

        return this;
    }

    has(target: string): boolean {
        return this.templates.has(target);
    }

    getSortingOptions(target: string): SearchSortingOption[] | undefined {
        const configuration = this.templates.get(target);

        if (!configuration?.overwriteSorting) {
            return undefined;
        }

        return getSearchSortingOptions(configuration.overwriteSorting);
    }

    handle(target: string, builder: ProductSearchBuilder): { facetLabels?: string[] } {
        const configuration = this.templates.get(target);

        if (!configuration) {
            console.error(`Relewise Web Components: Could not find search configuration with target: '${target}'`);
            return {
                facetLabels: [],
            };
        }

        let facetLabels: string[] | undefined = undefined;
        if (configuration.overwriteFacets) {
            builder.facets(b => b.clear());
            builder.facets(b => {
                const facetBuilder = new RelewiseFacetBuilder(b);
                configuration.overwriteFacets!(facetBuilder);
                facetLabels = facetBuilder.getLabels();
            });
        }

        if (configuration.overwriteSorting) {
            const sortingOptions = this.getSortingOptions(target) ?? [];
            const selectedSorting = getSearchSortingSelection(sortingOptions, readCurrentUrlState(QueryKeys.sortBy));

            builder.sorting(sortingBuilder => {
                if (selectedSorting) {
                    selectedSorting.apply(sortingBuilder);
                    return;
                }

                sortingBuilder.sortByProductRelevance();
            });
        }

        if (configuration.filters) {
            builder.filters(b => configuration.filters!(b));
        }

        if (configuration.relevanceModifiers) {
            builder.relevanceModifiers(b => configuration.relevanceModifiers!(b));
        }

        return {
            facetLabels: facetLabels,
        };
    }
}
