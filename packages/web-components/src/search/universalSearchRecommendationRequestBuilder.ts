import {
    ContentCategorySettingsRecommendationBuilder,
    ContentRecommendationRequest,
    ContentSettingsRecommendationBuilder,
    PopularContentCategoriesRecommendationBuilder,
    PopularContentCategoriesRecommendationRequest,
    PopularContentsBuilder,
    PopularProductCategoriesRecommendationBuilder,
    PopularProductCategoriesRecommendationRequest,
    PopularProductsBuilder,
    ProductCategorySettingsRecommendationBuilder,
    ProductRecommendationRequest,
    ProductSettingsRecommendationBuilder,
    type PopularSearchTermsRecommendationRequest,
    RecentlyViewedProductsBuilder,
    SearchTermBasedProductRecommendationBuilder,
    Settings,
    userIsAnonymous,
} from '@relewise/client';
import type { UniversalSearchRecommendationBlock } from '../app';
import { defaultContentCategoryProperties, defaultProductCategoryProperties, getSelectedContentProperties, getSelectedProductProperties } from '../defaultSettings';
import { getRelewiseUIOptions } from '../helpers';
import { buildPopularSearchTermsRequest } from './searchSuggestionsRequestBuilder';
import type { SearchSuggestionEntityType } from './types';

const defaultTake = 4;

export type PreparedUniversalSearchRecommendation =
    | { block: UniversalSearchRecommendationBlock; request: ProductRecommendationRequest; resultType: 'products' }
    | { block: UniversalSearchRecommendationBlock; request: PopularProductCategoriesRecommendationRequest; resultType: 'productCategories' }
    | { block: UniversalSearchRecommendationBlock; request: ContentRecommendationRequest; resultType: 'content' }
    | { block: UniversalSearchRecommendationBlock; request: PopularContentCategoriesRecommendationRequest; resultType: 'contentCategories' }
    | { block: UniversalSearchRecommendationBlock; request: PopularSearchTermsRecommendationRequest; resultType: 'searchTerms' };

type BuildRecommendationRequestOptions = {
    block: UniversalSearchRecommendationBlock;
    settings: Settings;
    targetEntityTypes: SearchSuggestionEntityType[];
    term: string;
};

export function buildUniversalSearchRecommendationRequest(options: BuildRecommendationRequestOptions): PreparedUniversalSearchRecommendation | null {
    const take = options.block.take ?? defaultTake;
    if (take <= 0) {
        return null;
    }

    switch (options.block.type) {
    case 'PopularProducts':
        return {
            block: options.block,
            request: withProductDefaults(new PopularProductsBuilder(options.settings), take).build(),
            resultType: 'products',
        };
    case 'RecentlyViewedProducts':
        if (userIsAnonymous(options.settings.user)) {
            return null;
        }

        return {
            block: options.block,
            request: withProductDefaults(new RecentlyViewedProductsBuilder(options.settings), take).build(),
            resultType: 'products',
        };
    case 'PopularProductCategories':
        return {
            block: options.block,
            request: withProductCategoryDefaults(new PopularProductCategoriesRecommendationBuilder(options.settings), take).build(),
            resultType: 'productCategories',
        };
    case 'PopularContents':
        return {
            block: options.block,
            request: withContentDefaults(new PopularContentsBuilder(options.settings), take).build(),
            resultType: 'content',
        };
    case 'PopularContentCategories':
        return {
            block: options.block,
            request: withContentCategoryDefaults(new PopularContentCategoriesRecommendationBuilder(options.settings), take).build(),
            resultType: 'contentCategories',
        };
    case 'PopularSearchTerms':
        if (options.targetEntityTypes.length === 0) {
            return null;
        }

        return {
            block: options.block,
            request: buildPopularSearchTermsRequest({
                settings: options.settings,
                take,
                targetEntityTypes: options.targetEntityTypes,
                term: options.term || undefined,
            }),
            resultType: 'searchTerms',
        };
    case 'SearchTermBasedProduct':
        if (!options.term) {
            return null;
        }

        return {
            block: options.block,
            request: withProductDefaults(new SearchTermBasedProductRecommendationBuilder(options.settings), take)
                .setTerm(options.term)
                .build(),
            resultType: 'products',
        };
    }
}

function withProductDefaults<T extends ProductSettingsRecommendationBuilder>(builder: T, take: number): T {
    const options = getRelewiseUIOptions();
    return builder
        .setSelectedProductProperties(getSelectedProductProperties(options))
        .setSelectedVariantProperties(options.selectedPropertiesSettings?.variant ?? null)
        .setNumberOfRecommendations(take)
        .filters(filters => options.filters?.product?.(filters))
        .relevanceModifiers(modifiers => options.relevanceModifiers?.product?.(modifiers));
}

function withProductCategoryDefaults<T extends ProductCategorySettingsRecommendationBuilder>(builder: T, take: number): T {
    const options = getRelewiseUIOptions();
    return builder
        .setProductCategoryProperties(options.selectedPropertiesSettings?.productCategory ?? defaultProductCategoryProperties)
        .setNumberOfRecommendations(take)
        .filters(filters => options.filters?.productCategory?.(filters))
        .relevanceModifiers(modifiers => options.relevanceModifiers?.productCategory?.(modifiers));
}

function withContentDefaults<T extends ContentSettingsRecommendationBuilder>(builder: T, take: number): T {
    const options = getRelewiseUIOptions();
    return builder
        .setSelectedContentProperties(getSelectedContentProperties(options))
        .setNumberOfRecommendations(take)
        .filters(filters => options.filters?.content?.(filters))
        .relevanceModifiers(modifiers => options.relevanceModifiers?.content?.(modifiers));
}

function withContentCategoryDefaults<T extends ContentCategorySettingsRecommendationBuilder>(builder: T, take: number): T {
    const options = getRelewiseUIOptions();
    return builder
        .setSelectedContentCategoryProperties(options.selectedPropertiesSettings?.contentCategory ?? defaultContentCategoryProperties)
        .setNumberOfRecommendations(take)
        .filters(filters => options.filters?.contentCategory?.(filters))
        .relevanceModifiers(modifiers => options.relevanceModifiers?.contentCategory?.(modifiers));
}
