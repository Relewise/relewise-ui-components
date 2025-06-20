/// <reference types="vite/client" />

import { registerRecommendationTarget } from '../../../src';


registerRecommendationTarget('first', {
    filter(builder) {
        builder.addProductCategoryIdFilter('ImmediateParent', ['4774']);
    },
});

registerRecommendationTarget('second', {
    filter(builder) {
        builder.addProductCategoryIdFilter('ImmediateParent', ['4797']);
    },
});