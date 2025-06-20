import { FilterBuilder } from '@relewise/client';
import { RelewiseFacetBuilder } from './facetBuilder';


export type TargetedSearchConfiguration = {
  facet?: (builder: RelewiseFacetBuilder) => void,
  filter?: (builder: FilterBuilder) => void;
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

    handleFilters(target: string, builder: FilterBuilder) {
        const configuration = this.templates.get(target);

        if (configuration && configuration.filter) {
            configuration.filter(builder);
        }
        else {
            console.error(`Relewise Web Components: Could not find search configuration with target: '${target}'`);
        }
    }

    handleFacets(target: string, builder: RelewiseFacetBuilder) {
        const configuration = this.templates.get(target);

        if (configuration && configuration.facet) {
            configuration.facet(builder);
        }
        else {
            console.error(`Relewise Web Components: Could not find search configuration with target: '${target}'`);
        }
    }
}   