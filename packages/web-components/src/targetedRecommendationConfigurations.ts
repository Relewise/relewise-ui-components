import { FilterBuilder } from '@relewise/client';

export type TargetedRecommendationConfiguration = {
  filter?: (builder: FilterBuilder) => void;
};

export class TargetedRecommendationConfigurations {

    private templates = new Map<string, TargetedRecommendationConfiguration>();

    constructor(initialValues?: (builder: TargetedRecommendationConfigurations) => void) {
        if (initialValues) initialValues(this);
    }

    add(configuration: {
        target: string;
        configuration: TargetedRecommendationConfiguration;
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
}   