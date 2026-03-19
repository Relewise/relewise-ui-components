import { ProductSortingBuilder } from '@relewise/client';
import { SortingEnum } from './enums';
import type { SortingLocalization } from '../app';

export interface SearchSortingOption {
    id: string;
    getLabel: (localization?: SortingLocalization) => string;
    apply: (builder: ProductSortingBuilder) => void;
}

export interface SearchSortingBuiltInOption {
    label?: string;
}

export interface SearchProductDataSortingOption {
    id?: string;
    label: string;
    key: string;
    selectionStrategy: Parameters<ProductSortingBuilder['sortByProductData']>[1];
    order: Parameters<ProductSortingBuilder['sortByProductData']>[2];
    mode?: Parameters<ProductSortingBuilder['sortByProductData']>[4];
}

function sortByRelevance(builder: ProductSortingBuilder) {
    builder.sortByProductRelevance('Descending', thenBy => thenBy.sortByProductRelevance());
}

function getProductDataSortingId(options: SearchProductDataSortingOption): string {
    const mode = options.mode ?? 'Auto';

    return `ProductData:${options.key}:${options.selectionStrategy}:${options.order}:${mode}`;
}

export class SearchSortingOptionsBuilder {
    private readonly options = new Map<string, SearchSortingOption>();

    constructor() {
        this
            .addRelevance()
            .addSalesPriceAscending()
            .addSalesPriceDescending()
            .addAlphabeticallyAscending()
            .addAlphabeticallyDescending();
    }

    clear(): this {
        this.options.clear();
        return this;
    }

    addRelevance(options?: SearchSortingBuiltInOption): this {
        return this.addOption({
            id: SortingEnum.Relevance,
            getLabel: localization => options?.label ?? localization?.relevance ?? 'Relevance',
            apply: builder => sortByRelevance(builder),
        });
    }

    addSalesPriceAscending(options?: SearchSortingBuiltInOption): this {
        return this.addOption({
            id: SortingEnum.SalesPriceAsc,
            getLabel: localization => options?.label ?? localization?.salesPriceAscending ?? 'Price: low - high',
            apply: builder => builder.sortByProductAttribute('SalesPrice', 'Ascending', thenBy => thenBy.sortByProductRelevance()),
        });
    }

    addSalesPriceDescending(options?: SearchSortingBuiltInOption): this {
        return this.addOption({
            id: SortingEnum.SalesPriceDesc,
            getLabel: localization => options?.label ?? localization?.salesPriceDescending ?? 'Price: high - low',
            apply: builder => builder.sortByProductAttribute('SalesPrice', 'Descending', thenBy => thenBy.sortByProductRelevance()),
        });
    }

    addAlphabeticallyAscending(options?: SearchSortingBuiltInOption): this {
        return this.addOption({
            id: SortingEnum.AlphabeticallyAsc,
            getLabel: localization => options?.label ?? localization?.alphabeticalAscending ?? 'Name: a - z',
            apply: builder => builder.sortByProductAttribute('DisplayName', 'Ascending', thenBy => thenBy.sortByProductRelevance()),
        });
    }

    addAlphabeticallyDescending(options?: SearchSortingBuiltInOption): this {
        return this.addOption({
            id: SortingEnum.AlphabeticallyDesc,
            getLabel: localization => options?.label ?? localization?.alphabeticalDescending ?? 'Name: z - a',
            apply: builder => builder.sortByProductAttribute('DisplayName', 'Descending', thenBy => thenBy.sortByProductRelevance()),
        });
    }

    addBrandAscending(options?: SearchSortingBuiltInOption): this {
        return this.addOption({
            id: SortingEnum.BrandAsc,
            getLabel: localization => options?.label ?? localization?.brandAscending ?? 'Brand: a - z',
            apply: builder => builder.sortByProductAttribute('BrandName', 'Ascending', thenBy => thenBy.sortByProductRelevance()),
        });
    }

    addBrandDescending(options?: SearchSortingBuiltInOption): this {
        return this.addOption({
            id: SortingEnum.BrandDesc,
            getLabel: localization => options?.label ?? localization?.brandDescending ?? 'Brand: z - a',
            apply: builder => builder.sortByProductAttribute('BrandName', 'Descending', thenBy => thenBy.sortByProductRelevance()),
        });
    }

    addPopularityAscending(options?: SearchSortingBuiltInOption): this {
        return this.addOption({
            id: SortingEnum.PopularityAsc,
            getLabel: localization => options?.label ?? localization?.popularityAscending ?? 'Popularity: low - high',
            apply: builder => builder.sortByProductPopularity('Ascending', thenBy => thenBy.sortByProductRelevance()),
        });
    }

    addPopularityDescending(options?: SearchSortingBuiltInOption): this {
        return this.addOption({
            id: SortingEnum.PopularityDesc,
            getLabel: localization => options?.label ?? localization?.popularityDescending ?? 'Popularity: high - low',
            apply: builder => builder.sortByProductPopularity('Descending', thenBy => thenBy.sortByProductRelevance()),
        });
    }

    addProductData(options: SearchProductDataSortingOption): this {
        return this.addOption({
            id: options.id ?? getProductDataSortingId(options),
            getLabel: () => options.label,
            apply: builder => builder.sortByProductData(
                options.key,
                options.selectionStrategy,
                options.order,
                thenBy => thenBy.sortByProductRelevance(),
                options.mode,
            ),
        });
    }

    build(): SearchSortingOption[] {
        return Array.from(this.options.values());
    }

    private addOption(option: SearchSortingOption): this {
        if (this.options.has(option.id)) {
            console.error(`Relewise Web Components: Duplicate search sorting option id '${option.id}'`);
            return this;
        }

        this.options.set(option.id, option);
        return this;
    }
}

export function getSearchSortingOptions(configure?: (builder: SearchSortingOptionsBuilder) => void): SearchSortingOption[] {
    const builder = new SearchSortingOptionsBuilder();
    if (configure) {
        configure(builder);
    }

    return builder.build();
}

export function getSearchSortingSelection(
    selectedOptionId: string | null | undefined,
    configure?: (builder: SearchSortingOptionsBuilder) => void,
): SearchSortingOption | null {
    const options = getSearchSortingOptions(configure);
    if (options.length < 1) {
        return null;
    }

    if (selectedOptionId) {
        const selected = options.find(option => option.id === selectedOptionId);
        if (selected) {
            return selected;
        }
    }

    return options.find(option => option.id === SortingEnum.Relevance) ?? options[0];
}
