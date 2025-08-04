/// <reference types="vite/client" />

import { registerSearchTarget } from '../../../../src/index';

registerSearchTarget('plp', {
    overwriteFacets(builder) {
        builder.addFacet((f) => f.addSalesPriceRangeFacet('Product'), { heading: 'Salgs pris' });
    },
    filters(builder) {
        builder.addProductCategoryIdFilter('ImmediateParent', ['4797']);
    },
    relevanceModifiers(builder) {
        builder.addBrandIdRelevanceModifier('83', 1000);
    },
});