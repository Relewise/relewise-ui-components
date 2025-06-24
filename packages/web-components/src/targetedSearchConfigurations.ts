import { FilterBuilder, ProductSearchBuilder } from '@relewise/client';
import { RelewiseFacetBuilder } from './facetBuilder';


export type TargetedSearchConfiguration = {
  overwriteFacets?: (builder: RelewiseFacetBuilder) => void,
  filters?: (builder: FilterBuilder) => void;
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

    hasOverwrittenFacets(target: string): boolean {
        const config = this.templates.get(target);
        return typeof config?.overwriteFacets === 'function';
    }

    handle(target: string, builder: ProductSearchBuilder): { labels?: string[] } {
        const configuration = this.templates.get(target);

        if (!configuration) {
            console.error(`Relewise Web Components: Could not find search configuration with target: '${target}'`);
            return {
                labels: [],
            };
        }

        let facetLabels: string[] | undefined = undefined;
        if (this.hasOverwrittenFacets(target) && configuration.overwriteFacets) {
            builder.facets(b => b.clear());
            builder.facets(b => {
                const facetBuilder = new RelewiseFacetBuilder(b);
                configuration.overwriteFacets!(facetBuilder);
                facetLabels = facetBuilder.getLabels();
            });
        }

        if (configuration.filters) {
            builder.filters(b => configuration.filters!(b));
        }
        
        return {
            labels: facetLabels,
        };
    }
}