import {
    PopularSearchTermsRecommendationBuilder,
    PopularSearchTermsRecommendationRequest,
    Settings,
} from '@relewise/client';
import type { SearchSuggestionEntityType } from '../app';

type PopularSearchTermsRequestOptions = {
    settings: Settings;
    take: number;
    targetEntityTypes: SearchSuggestionEntityType[];
    term?: string;
};

export function buildPopularSearchTermsRequest(options: PopularSearchTermsRequestOptions): PopularSearchTermsRecommendationRequest {
    const builder = new PopularSearchTermsRecommendationBuilder(options.settings)
        .addEntityType(...options.targetEntityTypes)
        .take(options.take);

    if (options.term !== undefined) {
        builder.setTerm(options.term);
    }

    return builder.build();
}
