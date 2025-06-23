import { FilterBuilder } from '@relewise/client';
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

    handleFilters(target: string, builder: FilterBuilder) {
        const configuration = this.templates.get(target);

        if (configuration && configuration.filters) {
            configuration.filters(builder);
        }
        else {
            console.error(`Relewise Web Components: Could not find search configuration with target: '${target}'`);
        }
    }

    handleFacets(target: string, builder: RelewiseFacetBuilder): string[] {
        const configuration = this.templates.get(target);

        if (!configuration || !configuration.overwriteFacets) {
            console.error(`Relewise Web Components: Could not find search configuration with target: '${target}'`);
            return [];
        }

        configuration.overwriteFacets(builder);
        return builder.getLabels();
    }
}