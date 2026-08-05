/// <reference types="vite/client" />

import { UserFactory } from '@relewise/client';
import { initializeRelewiseUI } from '../../../src/index';

function dataString(data: Record<string, { value?: unknown }> | null | undefined, key: string): string | null {
    const value = data?.[key]?.value;
    return typeof value === 'string' ? value : null;
}

function dataBoolean(data: Record<string, { value?: unknown }> | null | undefined, key: string): boolean | null {
    const value = data?.[key]?.value;
    return typeof value === 'boolean' ? value : null;
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
        templates: {
            product(product, { html, helpers }) {
                const url = dataString(product.data, 'Url');
                const image = dataString(product.data, 'ImageUrl');
                const description = dataString(product.data, 'ShortDescription');
                const color = dataString(product.data, 'Color');
                const fit = dataString(product.data, 'Fit');
                const season = dataString(product.data, 'Season');
                const onSale = dataBoolean(product.data, 'OnSale');
                const content = html`
                    ${image ? html`
                        <img
                            style="display:block;width:100%;aspect-ratio:4/5;object-fit:cover;background:#f7f7f7;"
                            src=${image}
                            alt=${product.displayName ?? ''}>
                    ` : helpers.nothing}
                    <div style="padding:.75rem;">
                        <strong style="display:block;margin-bottom:.5rem;">${product.displayName}</strong>
                        ${description ? html`<p style="margin:0 0 .75rem;color:#555;font-size:.875rem;line-height:1.35;">${description}</p>` : helpers.nothing}
                        <div style="display:flex;flex-wrap:wrap;gap:.35rem;margin-bottom:.75rem;font-size:.75rem;color:#555;">
                            ${color ? html`<span>${color}</span>` : helpers.nothing}
                            ${fit ? html`<span>${fit}</span>` : helpers.nothing}
                            ${season ? html`<span>${season}</span>` : helpers.nothing}
                            ${onSale ? html`<span>Sale</span>` : helpers.nothing}
                        </div>
                        <span>${helpers.formatPrice(product.salesPrice)}</span>
                        ${product.salesPrice && product.listPrice && product.salesPrice !== product.listPrice ? html`
                            <span style="margin-left:.35rem;color:#777;text-decoration:line-through;">${helpers.formatPrice(product.listPrice)}</span>
                        ` : helpers.nothing}
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
            productCategory(productCategory, { html, helpers }) {
                const url = dataString(productCategory.data, 'Url');
                const image = dataString(productCategory.data, 'ImageUrl');
                const description = dataString(productCategory.data, 'Description');
                const department = dataString(productCategory.data, 'Department');
                const audience = dataString(productCategory.data, 'AgeGroup');
                const content = html`
                    ${image ? html`
                        <img
                            style="display:block;width:100%;aspect-ratio:4/5;object-fit:cover;background:#f7f7f7;"
                            src=${image}
                            alt=${productCategory.displayName ?? ''}>
                    ` : helpers.nothing}
                    <div style="padding:.75rem;">
                        <strong style="display:block;margin-bottom:.5rem;">${productCategory.displayName}</strong>
                        ${description ? html`<p style="margin:0 0 .75rem;color:#555;font-size:.875rem;line-height:1.35;">${description}</p>` : helpers.nothing}
                        <div style="display:flex;flex-wrap:wrap;gap:.35rem;font-size:.75rem;color:#555;">
                            ${department ? html`<span>${department}</span>` : helpers.nothing}
                            ${audience ? html`<span>${audience}</span>` : helpers.nothing}
                        </div>
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
            content(content, { html, helpers }) {
                const url = dataString(content.data, 'Url');
                const image = dataString(content.data, 'ImageUrl');
                const summary = dataString(content.data, 'Summary');
                const topic = dataString(content.data, 'Topic');
                const audience = dataString(content.data, 'Audience');
                const season = dataString(content.data, 'Season');
                const tileContent = html`
                    ${image ? html`
                        <img
                            style="display:block;width:100%;aspect-ratio:4/5;object-fit:cover;background:#f7f7f7;"
                            src=${image}
                            alt=${content.displayName ?? ''}>
                    ` : helpers.nothing}
                    <div style="padding:.75rem;">
                        <strong style="display:block;margin-bottom:.5rem;">${content.displayName}</strong>
                        ${summary ? html`<p style="margin:0 0 .75rem;color:#555;font-size:.875rem;line-height:1.35;">${summary}</p>` : helpers.nothing}
                        <div style="display:flex;flex-wrap:wrap;gap:.35rem;font-size:.75rem;color:#555;">
                            ${topic ? html`<span>${topic}</span>` : helpers.nothing}
                            ${audience ? html`<span>${audience}</span>` : helpers.nothing}
                            ${season ? html`<span>${season}</span>` : helpers.nothing}
                        </div>
                    </div>
                `;

                if (url) {
                    return html`
                        <a style="display:block;height:100%;color:inherit;text-decoration:none;border:1px solid #ddd;" href=${url}>
                            ${tileContent}
                        </a>
                    `;
                }

                return html`
                    <article style="height:100%;border:1px solid #ddd;">
                        ${tileContent}
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
        },
    });

