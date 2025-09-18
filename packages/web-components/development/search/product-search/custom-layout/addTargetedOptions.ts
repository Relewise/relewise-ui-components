/// <reference types="vite/client" />

import { registerSearchTarget } from '../../../../src/index';

registerSearchTarget('plp', {
    facet(builder) {
        builder.addFacet((f) => f.addSalesPriceRangeFacet('Product'), { heading: 'Sales Price' });
    },
    filter(builder) {
        builder.addProductCategoryIdFilter('ImmediateParent', ['123']);
    },
});