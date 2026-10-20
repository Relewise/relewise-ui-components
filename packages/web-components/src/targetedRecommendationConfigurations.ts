import { FilterBuilder, RecommendationRequestBuilder, RelevanceModifierBuilder } from '@relewise/client';
import type { GetContextValues } from './initialize';

export type TargetedRecommendationConfiguration = {
  filters?: (builder: FilterBuilder) => void;
  relevanceModifiers?: (builder: RelevanceModifierBuilder) => void;
  getContextValues?: GetContextValues;
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

    async handle(target: string, builder: RecommendationRequestBuilder) {
        const configuration = this.templates.get(target);
    
        if (!configuration) {
            console.error(`Relewise Web Components: Could not find search configuration with target: '${target}'`);
            return;
        }
    
        if (configuration.filters) {
            builder.filters(b => configuration.filters!(b));
        }

        if (configuration.relevanceModifiers) {
            builder.relevanceModifiers(b => configuration.relevanceModifiers!(b));
        }

        for (const [key, value] of Object.entries(await configuration.getContextValues?.() ?? {})) {
            builder.addContextValue(key, value);
        }
    }
}
