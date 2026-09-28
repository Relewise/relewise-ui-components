import {
    RetailMediaQuery,
    RetailMediaQueryBuilder,
    RetailMediaResultPlacementResultEntityDisplayAd,
    RetailMediaResultPlacementResultEntityProduct,
    SelectedDisplayAdPropertiesSettings,
} from '@relewise/client';
import { nothing, type TemplateResult } from 'lit';
import type { ProductTemplateExtensions } from '../initialize';

export interface RetailMediaVariationConfiguration {
    key: string;
    minWidth: number;
}

export type RetailMediaPlacementPosition =
    | { type: 'beforeResults' }
    | { type: 'afterResults' }
    | { type: 'atPosition'; position: number };

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
    templates?: RetailMediaTemplates;
}

export interface RetailMediaTemplates {
    retailMediaSponsoredLabel?: (product: RetailMediaResultPlacementResultEntityProduct, extensions: ProductTemplateExtensions) => TemplateResult<1> | typeof nothing | Promise<TemplateResult<1> | typeof nothing>;
    retailMediaDisplayAd?: (displayAd: RetailMediaResultPlacementResultEntityDisplayAd, extensions: ProductTemplateExtensions) => TemplateResult<1>;
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

    build(): RetailMediaPlacementConfiguration {
        return {
            ...this.configuration,
        };
    }
}

export class RetailMediaTargetBuilder {
    private locationKey: string | null = null;
    private readonly placements: RetailMediaPlacementConfiguration[] = [];
    private readonly placementKeys = new Set<string>();

    location(key: string): this {
        this.locationKey = key;
        return this;
    }

    placement(key: string, configure?: (builder: RetailMediaPlacementBuilder) => void): this {
        const placementBuilder = new RetailMediaPlacementBuilder(key);
        configure?.(placementBuilder);
        const placement = placementBuilder.build();

        if (!placement.key) {
            console.warn('Relewise Web Components: A retail media placement was skipped because no placement key was configured.');
            return this;
        }

        if (this.placementKeys.has(placement.key)) {
            console.warn(`Relewise Web Components: Duplicate retail media placement key '${placement.key}' was skipped.`);
            return this;
        }

        if (placement.position.type === 'atPosition'
            && (!Number.isInteger(placement.position.position) || placement.position.position < 1)) {
            console.warn(`Relewise Web Components: Retail media placement '${placement.key}' was skipped because its position must be a positive integer.`);
            return this;
        }

        this.placementKeys.add(placement.key);
        this.placements.push(placement);
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
    private templatesValue: RetailMediaTemplates | undefined = undefined;

    variation(configuration: RetailMediaVariationConfiguration): this {
        this.variations.push({ ...configuration });
        return this;
    }

    selectedDisplayAdProperties(displayAdProperties: Partial<SelectedDisplayAdPropertiesSettings> | null): this {
        this.selectedDisplayAdPropertiesValue = displayAdProperties;
        return this;
    }

    templates(templates: RetailMediaTemplates): this {
        this.templatesValue = { ...templates };
        return this;
    }

    build(): RetailMediaConfiguration {
        return {
            variations: this.variations.map(variation => ({ ...variation })),
            selectedDisplayAdProperties: this.selectedDisplayAdPropertiesValue,
            templates: this.templatesValue ? { ...this.templatesValue } : undefined,
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
    targetConfiguration: RetailMediaTargetConfiguration | null,
): RetailMediaQuery | null {
    if (!target || !targetConfiguration) {
        return null;
    }

    if (!targetConfiguration.locationKey) {
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

    if (targetConfiguration.placements.length < 1) {
        console.warn(`Relewise Web Components: Retail media configuration for target '${target}' was skipped because no placements were configured.`);
        return null;
    }

    return new RetailMediaQueryBuilder()
        .setLocation({
            key: targetConfiguration.locationKey,
            variation: {
                key: variationKey,
            },
            placements: targetConfiguration.placements.map(placement => ({ key: placement.key })),
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
