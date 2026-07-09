import {
    RetailMediaQuery,
    RetailMediaQueryBuilder,
    RetailMediaQueryPlacementSelector,
    SelectedDisplayAdPropertiesSettings,
} from '@relewise/client';

export interface RetailMediaVariationConfiguration {
    key: string;
    minWidth: number;
}

export type RetailMediaPlacementPosition =
    | { type: 'beforeResults' }
    | { type: 'afterResults' }
    | { type: 'atPosition'; position: number }
    | { type: 'mixed'; every: number };

export interface RetailMediaPlacementConfiguration {
    key: string;
    position: RetailMediaPlacementPosition;
}

export interface RetailMediaTargetConfiguration {
    locationKey: string | null;
    placements: RetailMediaPlacementConfiguration[];
}

export interface RetailMediaConfiguration {
    variations: RetailMediaVariationConfiguration[];
    selectedDisplayAdProperties: Partial<SelectedDisplayAdPropertiesSettings> | null;
    targets: Map<string, RetailMediaTargetConfiguration>;
}

export class RetailMediaPlacementBuilder {
    private readonly configuration: RetailMediaPlacementConfiguration;

    constructor(key: string) {
        this.configuration = {
            key,
            position: { type: 'atPosition', position: 1 },
        };
    }

    beforeResults(): this {
        this.configuration.position = { type: 'beforeResults' };
        return this;
    }

    afterResults(): this {
        this.configuration.position = { type: 'afterResults' };
        return this;
    }

    atPosition(options: { position: number }): this {
        this.configuration.position = { type: 'atPosition', position: options.position };
        return this;
    }

    mixed(options: { every: number }): this {
        this.configuration.position = { type: 'mixed', every: options.every };
        return this;
    }

    build(): RetailMediaPlacementConfiguration {
        return {
            ...this.configuration,
        };
    }
}

export class RetailMediaTargetBuilder {
    private locationKey: string | null = null;
    private readonly placements: RetailMediaPlacementConfiguration[] = [];

    location(key: string): this {
        this.locationKey = key;
        return this;
    }

    placement(key: string, configure?: (builder: RetailMediaPlacementBuilder) => void): this {
        const placementBuilder = new RetailMediaPlacementBuilder(key);
        configure?.(placementBuilder);
        this.placements.push(placementBuilder.build());
        return this;
    }

    build(): RetailMediaTargetConfiguration {
        return {
            locationKey: this.locationKey,
            placements: this.placements.map(placement => ({
                ...placement,
            })),
        };
    }
}

export class RetailMediaOptionsBuilder {
    private readonly variations: RetailMediaVariationConfiguration[] = [];
    private selectedDisplayAdPropertiesValue: Partial<SelectedDisplayAdPropertiesSettings> | null = null;
    private readonly targets = new Map<string, RetailMediaTargetConfiguration>();

    variation(configuration: RetailMediaVariationConfiguration): this {
        this.variations.push({ ...configuration });
        return this;
    }

    selectedDisplayAdProperties(displayAdProperties: Partial<SelectedDisplayAdPropertiesSettings> | null): this {
        this.selectedDisplayAdPropertiesValue = displayAdProperties;
        return this;
    }

    target(target: string, configure: (builder: RetailMediaTargetBuilder) => void): this {
        const builder = new RetailMediaTargetBuilder();
        configure(builder);
        this.targets.set(target, builder.build());
        return this;
    }

    build(): RetailMediaConfiguration {
        return {
            variations: this.variations.map(variation => ({ ...variation })),
            selectedDisplayAdProperties: this.selectedDisplayAdPropertiesValue,
            targets: new Map(this.targets),
        };
    }
}

export function getRetailMediaConfiguration(configure?: (builder: RetailMediaOptionsBuilder) => void): RetailMediaConfiguration | null {
    if (!configure) {
        return null;
    }

    const builder = new RetailMediaOptionsBuilder();
    configure(builder);

    return builder.build();
}

export function buildRetailMediaQuery(
    target: string | null,
    globalConfiguration: RetailMediaConfiguration | null,
    targetedConfiguration: RetailMediaTargetConfiguration | null,
): RetailMediaQuery | null {
    if (!target) {
        return null;
    }

    const configuration = targetedConfiguration ?? globalConfiguration?.targets.get(target);
    if (!configuration) {
        return null;
    }

    if (!configuration.locationKey) {
        console.warn(`Relewise Web Components: Retail media configuration for target '${target}' was skipped because no location key was configured.`);
        return null;
    }

    const variationKey = getVariationKey(
        globalConfiguration?.variations ?? [],
        target,
    );
    if (!variationKey) {
        return null;
    }

    const placements = getPlacementSelectors(configuration, target);
    if (placements.length < 1) {
        return null;
    }

    return new RetailMediaQueryBuilder()
        .setLocation({
            key: configuration.locationKey,
            variation: {
                key: variationKey,
            },
            placements,
        })
        .setSelectedDisplayAdProperties(globalConfiguration?.selectedDisplayAdProperties ?? null)
        .build();
}

function getVariationKey(
    variations: RetailMediaVariationConfiguration[],
    target: string,
): string | null {
    if (variations.length < 1) {
        console.warn(`Relewise Web Components: Retail media configuration for target '${target}' was skipped because no variation keys were configured.`);
        return null;
    }

    const viewportWidth = typeof window === 'undefined' ? Number.MAX_SAFE_INTEGER : window.innerWidth;
    const matchingVariation = variations
        .filter(variation => variation.minWidth !== undefined && viewportWidth >= variation.minWidth)
        .sort((first, second) => second.minWidth - first.minWidth)[0];

    if (matchingVariation) {
        return matchingVariation.key;
    }

    const fallbackVariation = variations[0];
    console.warn(`Relewise Web Components: Retail media target '${target}' did not match a configured breakpoint. Falling back to variation '${fallbackVariation.key}'.`);

    return fallbackVariation.key;
}

function getPlacementSelectors(
    configuration: RetailMediaTargetConfiguration,
    target: string,
): RetailMediaQueryPlacementSelector[] {
    const placementKeys = new Set<string>();
    const placements: RetailMediaQueryPlacementSelector[] = [];

    configuration.placements.forEach(placement => {
        if (!placement.key) {
            console.warn(`Relewise Web Components: A retail media placement for target '${target}' was skipped because no placement key was configured.`);
            return;
        }

        if (placementKeys.has(placement.key)) {
            console.warn(`Relewise Web Components: Duplicate retail media placement key '${placement.key}' for target '${target}' was skipped.`);
            return;
        }

        placementKeys.add(placement.key);
        placements.push({ key: placement.key });
    });

    if (placements.length < 1) {
        console.warn(`Relewise Web Components: Retail media configuration for target '${target}' was skipped because no placements were configured.`);
    }

    return placements;
}
