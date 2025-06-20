import { FilterBuilder } from '@relewise/client';
import { RelewiseFacetBuilder } from './facetBuilder';


export type TargetedConfiguration = {
  facet?: (builder: RelewiseFacetBuilder) => void,
  filter?: (builder: FilterBuilder) => void;
};

export class TargetedConfigurations {

    private templates = new Map<string, TargetedConfiguration>();

    constructor(initialValues?: (builder: TargetedConfigurations) => void) {
        if (initialValues) initialValues(this);
    }

    add(options: {
        target: string;
        configuration: TargetedConfiguration;
    }): this {

        this.templates.set(options.target, options.configuration);

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