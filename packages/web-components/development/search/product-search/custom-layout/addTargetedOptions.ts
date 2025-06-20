/// <reference types="vite/client" />

import { addTargetedOptions } from '../../../../src/index';

addTargetedOptions('plp', {
    facet(builder) {
        builder.addFacet((f) => f.addSalesPriceRangeFacet('Product'), { heading: 'Salgs pris' });
    },
    filter(builder) {
        builder.addProductCategoryIdFilter('ImmediateParent', ['123']);
    },
});