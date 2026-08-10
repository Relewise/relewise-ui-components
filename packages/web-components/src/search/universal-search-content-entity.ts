import { ContentResult, ContentSearchRequest, ContentSearchResponse, Searcher } from '@relewise/client';
import { getRelewiseUISearchOptions } from '../helpers';
import { buildContentSearchRequest } from './contentSearchRequestBuilder';
import { UniversalSearchEntityBase, UniversalSearchEntityRequestOptions } from './universal-search-entity';
import { UniversalSearchTabId } from './universal-search-tab-settings';

export class UniversalSearchContentEntity extends UniversalSearchEntityBase<ContentSearchRequest, ContentSearchResponse, ContentResult> {
    readonly id = UniversalSearchTabId.content;
    protected readonly responseType = 'Relewise.Client.Responses.Search.ContentSearchResponse, Relewise.Client';
    protected readonly defaultTabLabel = 'Content';
    protected readonly defaultError = 'Could not load content.';

    protected get localization() {
        return getRelewiseUISearchOptions()?.localization?.universalSearch?.content;
    }

    protected buildRequest(options: UniversalSearchEntityRequestOptions) {
        const pagination = this.resolvePagination(options);
        return buildContentSearchRequest({
            term: options.term,
            settings: options.settings,
            page: pagination.page,
            pageSize: pagination.pageSize,
        });
    }

    protected executeRequest(searcher: Searcher, request: ContentSearchRequest, abortSignal: AbortSignal) {
        return searcher.searchContents(request, { abortSignal });
    }
}
