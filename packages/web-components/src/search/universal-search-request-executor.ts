import { SearchCollectionBuilder } from '@relewise/client';
import { getSearcher } from './searcher';
import { getUniversalSearchResponses } from './universal-search-response';
import { UniversalSearchRequest, UniversalSearchResponses } from './universal-search.types';

export async function executeUniversalSearchRequests(
    searcher: ReturnType<typeof getSearcher>,
    requests: UniversalSearchRequest[],
    abortSignal: AbortSignal,
): Promise<UniversalSearchResponses> {
    if (requests.length === 1) {
        return await executeSingleSearchRequest(searcher, requests[0], abortSignal);
    }

    const requestBuilder = new SearchCollectionBuilder();
    requests.forEach(request => requestBuilder.addRequest(request.request));

    const response = await searcher.batch(requestBuilder.build(), { abortSignal });

    return response ? getUniversalSearchResponses(response) : {};
}

async function executeSingleSearchRequest(
    searcher: ReturnType<typeof getSearcher>,
    request: UniversalSearchRequest,
    abortSignal: AbortSignal,
): Promise<UniversalSearchResponses> {
    if (request.tab === 'products') {
        const response = await searcher.searchProducts(request.request, { abortSignal });
        return response ? { products: response } : {};
    }

    if (request.tab === 'productCategories') {
        const response = await searcher.searchProductCategories(request.request, { abortSignal });
        return response ? { productCategories: response } : {};
    }

    const response = await searcher.searchContents(request.request, { abortSignal });

    return response ? { content: response } : {};
}
