/// <reference types="vite/client" />

import { registerRecommendationTarget } from '../../../src';


registerRecommendationTarget('first', {
    filters(builder) {
        builder.addProductCategoryIdFilter('ImmediateParent', ['4774']);
    },
});

registerRecommendationTarget('second', {
    filters(builder) {
        builder.addProductCategoryIdFilter('ImmediateParent', ['4797']);
    },
});