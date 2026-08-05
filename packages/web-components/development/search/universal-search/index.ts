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
        selectedPropertiesSettings: {
            product: {
                displayName: true,
                pricing: true,
                dataKeys: ['Url', 'Image', 'ImageUrl'],
            },
            productCategory: {
                displayName: true,
                dataKeys: ['Url', 'ImageUrl'],
            },
            content: {
                displayName: true,
                dataKeys: ['Url', 'ImageUrl', 'Summary'],
            },
        },
        templates: {
            product(product, { html, helpers }) {
                const url = product.data?.['Url']?.value;
                const image = product.data?.['Image']?.value ?? product.data?.['ImageUrl']?.value;
                const content = html`
                    ${image ? html`
                        <img
                            style="display:block;width:100%;aspect-ratio:1/1;object-fit:contain;background:#f7f7f7;"
                            src=${image}
                            alt=${product.displayName ?? ''}>
                    ` : helpers.nothing}
                    <div style="padding:.75rem;">
                        <strong style="display:block;margin-bottom:.5rem;">${product.displayName}</strong>
                        <span>${helpers.formatPrice(product.salesPrice)}</span>
                    </div>
                `;

                if (url) {
                    return html`
                        <a style="display:block;height:100%;color:inherit;text-decoration:none;border:1px solid #ddd;" href=${url}>
                            ${content}
                        </a>
                    `;
                }

                return html`
                    <article style="height:100%;border:1px solid #ddd;">
                        ${content}
                    </article>
                `;
            },
        },
    },
)
    .useSearch({
        facets: {
            product(builder) {
                builder
                    .addFacet((f) => f.addBrandFacet(), { heading: 'Brands' })
                    .addFacet((f) => f.addCategoryFacet('ImmediateParent'), { heading: 'Categories' })
                    .addFacet((f) => f.addSalesPriceRangeFacet('Product'), { heading: 'Sales Price' });
            },
            content(builder) {
                builder
                    .addFacet((f) => f.addCategoryFacet('ImmediateParent'), { heading: 'Content categories' });

                // Dataset-specific example. Replace "ContentType" with a content data key from your dataset.
                // builder.addFacet((f) => f.addContentDataStringValueFacet('ContentType'), { heading: 'Content types' });
            },
            // Dataset-specific example. Replace "Department" with a product category data key from your dataset.
            // productCategory(builder) {
            //     builder.addFacet((f) => f.addProductCategoryDataStringValueFacet('Gender'), { heading: 'Gender' });
            // },
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
            .addPopularityDescending(),
        // Dataset-specific examples:
        // filters: {
        //     product(builder) {
        //         builder.addProductCategoryIdFilter('ImmediateParent', ['YOUR_CATEGORY_ID']);
        //     },
        // },
        // sorting: sorting => sorting.addProductData({
        //     label: 'Custom score',
        //     key: 'YOUR_DATA_KEY',
        //     selectionStrategy: 'Product',
        //     order: 'Descending',
        //     mode: 'Numerical',
        // }),
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
        },
    });

