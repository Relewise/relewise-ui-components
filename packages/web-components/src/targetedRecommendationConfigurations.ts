import { FilterBuilder, ProductSettingsRecommendationBuilder } from '@relewise/client';

export type TargetedRecommendationConfiguration = {
  filters?: (builder: FilterBuilder) => void;
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

    handle(target: string, builder: ProductSettingsRecommendationBuilder) {
        const configuration = this.templates.get(target);
    
        if (!configuration) {
            console.error(`Relewise Web Components: Could not find search configuration with target: '${target}'`);
            return;
        }
    
        if (configuration.filters) {
            builder.filters(b => configuration.filters!(b));
        }
    }
}   