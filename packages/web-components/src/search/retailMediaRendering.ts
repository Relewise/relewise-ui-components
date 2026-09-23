import type {
    ProductResult,
    RetailMediaResult,
    RetailMediaResultPlacementResultEntity,
} from '@relewise/client';
import type { RetailMediaPlacementPosition, RetailMediaTargetConfiguration } from '../builders/retailMediaBuilder';

export type ProductSearchRenderItem =
    | {
        type: 'product';
        product: ProductResult;
    }
    | {
        entity: RetailMediaResultPlacementResultEntity;
        type: 'retailMedia';
    };

type RetailMediaRenderPlacement = {
    entities: ProductSearchRenderItem[];
    position: RetailMediaPlacementPosition;
};

export function getProductSearchRenderItems(
    products: ProductResult[],
    retailMedia: RetailMediaResult | null | undefined,
    configuration: RetailMediaTargetConfiguration | null,
): ProductSearchRenderItem[] {
    const placements = getRetailMediaRenderPlacements(retailMedia, configuration);
    if (placements.length === 0) {
        return products.map(productRenderItem);
    }

    const beforeResults: ProductSearchRenderItem[] = [];
    const afterResults: ProductSearchRenderItem[] = [];
    const atPositions = new Map<number, ProductSearchRenderItem[]>();

    placements.forEach(placement => {
        if (placement.position.type === 'beforeResults') {
            beforeResults.push(...placement.entities);
            return;
        }

        if (placement.position.type === 'afterResults') {
            afterResults.push(...placement.entities);
            return;
        }

        const items = atPositions.get(placement.position.position) ?? [];
        items.push(...placement.entities);
        atPositions.set(placement.position.position, items);
    });

    const result = [...beforeResults];
    products.forEach((product, index) => {
        result.push(...(atPositions.get(index + 1) ?? []));
        result.push(productRenderItem(product));
    });

    [...atPositions.entries()]
        .filter(([position]) => position > products.length)
        .sort(([first], [second]) => first - second)
        .forEach(([, items]) => result.push(...items));

    result.push(...afterResults);
    return result;
}

function getRetailMediaRenderPlacements(
    retailMedia: RetailMediaResult | null | undefined,
    configuration: RetailMediaTargetConfiguration | null,
): RetailMediaRenderPlacement[] {
    if (!retailMedia?.placements || !configuration) {
        return [];
    }

    return configuration.placements.flatMap(placement => {
        const results = retailMedia.placements?.[placement.key]?.results ?? [];
        const entities = results.flatMap(entity => {
            if (!entity.promotedProduct && !entity.promotedDisplayAd) {
                console.warn(`Relewise Web Components: An empty retail media result for placement '${placement.key}' was skipped.`);
                return [];
            }

            return [{
                entity,
                type: 'retailMedia' as const,
            }];
        });

        return entities.length > 0 ? [{ entities, position: placement.position }] : [];
    });
}

function productRenderItem(product: ProductResult): ProductSearchRenderItem {
    return {
        product,
        type: 'product',
    };
}
