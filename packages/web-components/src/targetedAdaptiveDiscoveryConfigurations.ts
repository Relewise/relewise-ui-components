import type { AdaptiveDiscoveryFeedConfiguration } from './adaptiveDiscovery';

export class TargetedAdaptiveDiscoveryConfigurations {
    private configurations = new Map<string, AdaptiveDiscoveryFeedConfiguration>();

    constructor(initialValues?: (builder: TargetedAdaptiveDiscoveryConfigurations) => void) {
        initialValues?.(this);
    }

    add(configuration: {
        target: string;
        configuration: AdaptiveDiscoveryFeedConfiguration;
    }): this {
        this.configurations.set(configuration.target, configuration.configuration);

        return this;
    }

    has(target: string): boolean {
        return this.configurations.has(target);
    }

    resolve(target: string, defaultConfiguration: AdaptiveDiscoveryFeedConfiguration): AdaptiveDiscoveryFeedConfiguration {
        const configuration = this.configurations.get(target);

        if (!configuration) {
            console.error(`Relewise Web Components: Could not find Adaptive Discovery configuration with target: '${target}'`);
            return defaultConfiguration;
        }

        return configuration;
    }
}
