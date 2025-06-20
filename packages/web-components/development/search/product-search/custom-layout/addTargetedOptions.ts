/// <reference types="vite/client" />

import { addTargetedConfiguration } from '../../../../src/index';

addTargetedConfiguration('plp', {
    facet(builder) {
        builder.addFacet((f) => f.addSalesPriceRangeFacet('Product'), { heading: 'Salgs pris' });
    },
    filter(builder) {
        // builder.addProductCategoryIdFilter('ImmediateParent', ['123']);
    },
});