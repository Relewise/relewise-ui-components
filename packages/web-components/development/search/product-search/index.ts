/// <reference types="vite/client" />

import { UserFactory } from '@relewise/client';
import { initializeRelewiseUI } from '../../../src/index';

initializeRelewiseUI(
    {
        contextSettings: {
            getUser: () => {
                return UserFactory.anonymous();
            },
            language: import.meta.env.VITE_LANGUAGE,
            currency: import.meta.env.VITE_CURRENCY,
        },
        datasetId: import.meta.env.VITE_DATASET_ID,
        apiKey: import.meta.env.VITE_API_KEY,
        clientOptions: {
            serverUrl: import.meta.env.VITE_SERVER_URL,
        },
    },
).useSearch({
    facets: {
        facetBuilder(builder) {
            builder
                .addCategoryFacet('ImmediateParent')
                .addBrandFacet()
                .addProductDataStringValueFacet('Serie', 'Product')
                .addProductDataStringValueFacet('Color', 'Product')
                .addProductDataBooleanValueFacet('InStock', 'Product')
                .addSalesPriceRangeFacet('Product')
                //.addProductAssortmentFacet('Product')
                //.addListPriceRangesFacet('Product', [{lowerBound: 1, upperBound: 1000}], 1000,  [{lowerBound: 1, upperBound: 1000}])
                .addListPriceRangeFacet('Product')
                //.addProductDataDoubleRangesFacet('RoundingValue', 'Product', [{lowerBound: 1, upperBound: 10}], 10)
                .addProductDataDoubleRangeFacet('RoundingValue', 'Product')
                .addProductDataDoubleValueFacet('RoundingValue', 'Product');
            //.addProductDataObjectFacet()
            //.addVariantSpecificationFacet()
        },
    },
    localization: {
        facets: {
            saveButton: 'Gem',
            showLessButton: 'Vis færre',
            showMoreButton: 'Vis flere',
        },
        loadMoreButton: {
            button: 'Hent flere',
        },
        searchBar: {
            placeholder: 'Søg her',
            searchButton: 'Søg',
        },
        sortingButton: {
            popularityOption: 'populære',
            alphabeticalAscendingOption: 'a - å',
            alphabeticalDescendingOption: 'å - a',
            salesPriceAscendingOption: 'Billigste først',
            salesPriceDescendingOption: 'Dyreste først',
        },
    },
});