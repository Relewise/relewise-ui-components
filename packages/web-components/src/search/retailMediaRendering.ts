import type {
    ProductResult,
    RetailMediaResult,
    RetailMediaResultPlacementResultEntity,
} from '@relewise/client';
import type { RetailMediaPlacementPosition, RetailMediaTargetConfiguration } from '../builders/retailMediaBuilder';
import { getRelewiseUIRetailMediaConfiguration } from '../helpers/relewiseUIOptions';

export type ProductSearchRenderItem =
    | {
        type: 'product';
        product: ProductResult;
    }
    | {
        entity: RetailMediaResultPlacementResultEntity;
        type: 'retailMedia';
    };

export type ProductSearchRenderPage = {
    products: ProductResult[];
    retailMedia: RetailMediaResult | null | undefined;
    retailMediaTargetConfiguration: RetailMediaTargetConfiguration | null;
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

export function getProductSearchRenderItemsForPages(
    pages: ProductSearchRenderPage[],
): ProductSearchRenderItem[] {
    return pages.flatMap(page => getProductSearchRenderItems(
        page.products,
        page.retailMedia,
        page.retailMediaTargetConfiguration,
    ));
}

function getRetailMediaRenderPlacements(
    retailMedia: RetailMediaResult | null | undefined,
    configuration: RetailMediaTargetConfiguration | null,
): RetailMediaRenderPlacement[] {
    if (!retailMedia?.placements || !configuration) {
        return [];
    }

    const displayAdTemplate = getRelewiseUIRetailMediaConfiguration()?.templates?.retailMediaDisplayAd;
    const placementKeys = new Set<string>();

    return configuration.placements.flatMap(placement => {
        if (!placement.key
            || placementKeys.has(placement.key)
            || (placement.position.type === 'atPosition'
                && (!Number.isInteger(placement.position.position) || placement.position.position < 1))) {
            return [];
        }

        placementKeys.add(placement.key);
        const results = retailMedia.placements?.[placement.key]?.results ?? [];
        const entities = results.flatMap(entity => {
            if (!entity.promotedProduct && !entity.promotedDisplayAd) {
                console.warn(`Relewise Web Components: An empty retail media result for placement '${placement.key}' was skipped.`);
                return [];
            }

            if (!entity.promotedProduct && entity.promotedDisplayAd && !displayAdTemplate) {
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
