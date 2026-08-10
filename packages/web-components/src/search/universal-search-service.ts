import { SearchCollectionBuilder, User } from '@relewise/client';
import { getRelewiseContextSettings, getRelewiseUIOptions } from '../helpers/relewiseUIOptions';
import { getSearcher } from './searcher';
import type { UniversalSearchEntity, UniversalSearchPreparedRequest } from './universal-search-entity';

type UniversalSearchServiceOptions = {
    entities: UniversalSearchEntity[];
    term: string;
    target: string | null;
    displayedAtLocation?: string;
    abortSignal: AbortSignal;
};

export async function searchUniversalSearchEntities(options: UniversalSearchServiceOptions): Promise<User | null> {
    const relewiseUIOptions = getRelewiseUIOptions();
    const searcher = getSearcher(relewiseUIOptions);

    // await here to ensure targets can be handled before making api requests
    await new Promise(r => setTimeout(r, 0));
    const settings = await getRelewiseContextSettings(options.displayedAtLocation ?? 'Relewise Universal Search');
    const requests = options.entities.map(entity => entity.prepareRequest(options.term, settings, options.target));

    await executeUniversalSearchRequests(searcher, requests, options.abortSignal);

    return settings.user;
}

async function executeUniversalSearchRequests(
    searcher: ReturnType<typeof getSearcher>,
    requests: UniversalSearchPreparedRequest[],
    abortSignal: AbortSignal,
): Promise<void> {
    if (requests.length === 1) {
        await requests[0].executeSingle(searcher, abortSignal);
        return;
    }

    const requestBuilder = new SearchCollectionBuilder();
    requests.forEach(request => requestBuilder.addRequest(request.request));
    const response = await searcher.batch(requestBuilder.build(), { abortSignal });

    if (!abortSignal.aborted && response) {
        requests.forEach(request => request.applyBatchResponse(response));
    }
}
