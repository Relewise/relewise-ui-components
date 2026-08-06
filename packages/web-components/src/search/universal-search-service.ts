import { User } from '@relewise/client';
import { getRelewiseContextSettings, getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { getSearcher } from './searcher';
import { buildUniversalSearchRequests } from './universal-search-request-builder';
import { executeUniversalSearchRequests } from './universal-search-request-executor';
import type { UniversalSearchRequestBuilderOptions } from './universal-search-request-builder';
import type { UniversalSearchResponses } from './universal-search.types';

export type UniversalSearchServiceOptions = Omit<UniversalSearchRequestBuilderOptions, 'settings'> & {
    displayedAtLocation?: string;
    abortSignal: AbortSignal;
};

export type UniversalSearchServiceResult = {
    responses: UniversalSearchResponses;
    user: User | null;
    productFacetLabels: string[];
    productCategoryFacetLabels: string[];
    contentFacetLabels: string[];
};

export async function searchUniversalSearchTabs(options: UniversalSearchServiceOptions): Promise<UniversalSearchServiceResult> {
    const relewiseUIOptions = getRelewiseUIOptions();
    const searcher = getSearcher(relewiseUIOptions);

    await new Promise(r => setTimeout(r, 0));
    const settings = await getRelewiseContextSettings(options.displayedAtLocation ?? 'Relewise Universal Search');
    const requestResult = buildUniversalSearchRequests({
        ...options,
        settings,
    });

    return {
        responses: await executeUniversalSearchRequests(searcher, requestResult.requests, options.abortSignal),
        user: settings.user,
        productFacetLabels: requestResult.productFacetLabels,
        productCategoryFacetLabels: requestResult.productCategoryFacetLabels,
        contentFacetLabels: requestResult.contentFacetLabels,
    };
}
