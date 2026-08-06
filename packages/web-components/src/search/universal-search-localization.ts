import { getRelewiseUISearchOptions } from '../helpers';
import { UniversalSearchTab } from './universal-search.types';

export function getUniversalSearchTabLocalization(tab: UniversalSearchTab | null) {
    const universalSearchLocalization = getRelewiseUISearchOptions()?.localization?.universalSearch;

    if (tab === 'productCategories') {
        return universalSearchLocalization?.productCategories;
    }

    if (tab === 'content') {
        return universalSearchLocalization?.content;
    }

    return universalSearchLocalization?.products;
}
