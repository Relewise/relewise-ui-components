/// <reference types="vite/client" />

import { UserFactory } from '@relewise/client';
import { initializeRelewiseUI } from '../../../src/index';
import { customTemplates } from './templates';

const useCustomTemplates = new URLSearchParams(window.location.search).get('templates') === 'custom';
const templateMode = document.querySelector('#template-mode');

if (templateMode) {
    templateMode.textContent = useCustomTemplates
        ? 'This variant uses custom entity templates.'
        : 'This variant uses the component\'s default entity templates.';
}

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
        selectedPropertiesSettings: {
            product: {
                displayName: true,
                pricing: true,
                dataKeys: [
                    'Url',
                    'ImageUrl',
                    'ShortDescription',
                    'Color',
                    'Material',
                    'Fit',
                    'Gender',
                    'AgeGroup',
                    'Season',
                    'Occasion',
                    'Sustainability',
                    'NewArrival',
                    'OnSale',
                    'Badges',
                    'PopularityScore',
                ],
            },
            productCategory: {
                displayName: true,
                dataKeys: [
                    'Url',
                    'ImageUrl',
                    'Description',
                    'Gender',
                    'AgeGroup',
                    'Department',
                    'Season',
                    'CategoryType',
                    'Priority',
                ],
            },
            content: {
                displayName: true,
                dataKeys: [
                    'Url',
                    'ImageUrl',
                    'Summary',
                    'ArticleType',
                    'Topic',
                    'Audience',
                    'Season',
                    'ReadingTimeMinutes',
                    'Featured',
                    'RelatedProductCategoryIds',
                ],
            },
        },
        ...(useCustomTemplates ? { templates: customTemplates } : {}),
    },
)
    .useSearch({
        facets: {
            product(builder) {
                builder
                    .addFacet((f) => f.addBrandFacet(), { heading: 'Brands' })
                    .addFacet((f) => f.addCategoryFacet('ImmediateParent'), { heading: 'Categories' })
                    .addFacet((f) => f.addSalesPriceRangeFacet('Product'), { heading: 'Price' })
                    .addFacet((f) => f.addProductDataStringValueFacet('Color', 'Product'), { heading: 'Colors' })
                    .addFacet((f) => f.addProductDataStringValueFacet('Material', 'Product'), { heading: 'Materials' })
                    .addFacet((f) => f.addProductDataStringValueFacet('Fit', 'Product'), { heading: 'Fits' })
                    .addFacet((f) => f.addProductDataStringValueFacet('Season', 'Product'), { heading: 'Seasons' })
                    .addFacet((f) => f.addProductDataBooleanValueFacet('OnSale', 'Product'), { heading: 'On sale' });
            },
            productCategory(builder) {
                builder
                    .addFacet((f) => f.addProductCategoryDataStringValueFacet('Gender'), { heading: 'Gender' })
                    .addFacet((f) => f.addProductCategoryDataStringValueFacet('AgeGroup'), { heading: 'Age groups' })
                    .addFacet((f) => f.addProductCategoryDataStringValueFacet('Department'), { heading: 'Departments' })
                    .addFacet((f) => f.addProductCategoryDataStringValueFacet('Season'), { heading: 'Seasons' })
                    .addFacet((f) => f.addProductCategoryDataStringValueFacet('CategoryType'), { heading: 'Category types' });
            },
            content(builder) {
                builder
                    .addFacet((f) => f.addCategoryFacet('ImmediateParent'), { heading: 'Content categories' })
                    .addFacet((f) => f.addContentDataStringValueFacet('ArticleType'), { heading: 'Article types' })
                    .addFacet((f) => f.addContentDataStringValueFacet('Topic'), { heading: 'Topics' })
                    .addFacet((f) => f.addContentDataStringValueFacet('Audience'), { heading: 'Audiences' })
                    .addFacet((f) => f.addContentDataStringValueFacet('Season'), { heading: 'Seasons' })
                    .addFacet((f) => f.addContentDataBooleanValueFacet('Featured'), { heading: 'Featured' });
            },
        },
        sorting: sorting => sorting
            .clear()
            .addRelevance()
            .addSalesPriceAscending()
            .addSalesPriceDescending()
            .addAlphabeticallyAscending()
            .addAlphabeticallyDescending()
            .addBrandAscending()
            .addBrandDescending()
            .addPopularityAscending()
            .addPopularityDescending()
            .addProductData({
                label: 'Demo popularity score',
                key: 'PopularityScore',
                selectionStrategy: 'Product',
                order: 'Descending',
                mode: 'Numerical',
            }),
        universalSearch: {
            entities: {
                products: {
                    pageSize: 15,
                },
                productCategories: {
                    pageSize: 15,
                },
                content: {
                    pageSize: 15,
                },
            },
            suggestions: {
                popularSearchTerms: {
                    take: 5,
                },
                searchTermPredictions: {
                    take: 5,
                },
            },
        },
    });
