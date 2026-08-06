import type { ContentSearchResponse, ProductCategorySearchResponse, ProductSearchResponse, SearchResponseCollection } from '@relewise/client';
import type { UniversalSearchResponses } from './universal-search.types';

const responseTypes = {
    productSearch: 'Relewise.Client.Responses.Search.ProductSearchResponse, Relewise.Client',
    productCategorySearch: 'Relewise.Client.Responses.Search.ProductCategorySearchResponse, Relewise.Client',
    contentSearch: 'Relewise.Client.Responses.Search.ContentSearchResponse, Relewise.Client',
};

type SearchResponse = NonNullable<SearchResponseCollection['responses']>[number];
type SearchResponseWithType = SearchResponse & { $type?: string };

export function getUniversalSearchResponses(response: SearchResponseCollection): UniversalSearchResponses {
    return {
        products: findResponseOfType<ProductSearchResponse>(response.responses ?? undefined, responseTypes.productSearch),
        productCategories: findResponseOfType<ProductCategorySearchResponse>(response.responses ?? undefined, responseTypes.productCategorySearch),
        content: findResponseOfType<ContentSearchResponse>(response.responses ?? undefined, responseTypes.contentSearch),
    };
}

function findResponseOfType<T>(responses: SearchResponse[] | undefined, typeName: string): T | undefined {
    if (!responses) return undefined;
    return responses.find(r => (r as SearchResponseWithType).$type === typeName) as T | undefined;
}
