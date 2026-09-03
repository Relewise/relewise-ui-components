/// <reference types="vite/client" />

import { ProductCategoryResult, UserFactory } from '@relewise/client';
import { initializeRelewiseUI, ProductCategoryTile } from '../../../src';

initializeRelewiseUI({
    contextSettings: {
        getUser: () => UserFactory.anonymous(),
        language: 'en-US',
        currency: 'USD',
    },
    datasetId: '00000000-0000-0000-0000-000000000000',
    apiKey: 'category-tile-spacing-poc',
}).useRecommendations();

function image(label: string, start: string, end: string): string {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400">
            <defs>
                <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stop-color="${start}" />
                    <stop offset="1" stop-color="${end}" />
                </linearGradient>
            </defs>
            <rect width="640" height="400" fill="url(#background)" />
            <circle cx="520" cy="90" r="120" fill="white" fill-opacity="0.16" />
            <circle cx="100" cy="360" r="180" fill="white" fill-opacity="0.1" />
            <text x="40" y="350" fill="white" font-family="Arial, sans-serif" font-size="52" font-weight="700">${label}</text>
        </svg>`;

    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function category(id: string, displayName: string, imageUrl?: string): ProductCategoryResult {
    return {
        categoryId: id,
        displayName,
        rank: 1,
        data: {
            Url: { type: 'String', isCollection: false, value: '#poc' },
            ...(imageUrl ? { ImageUrl: { type: 'String', isCollection: false, value: imageUrl } } : {}),
        },
    } as unknown as ProductCategoryResult;
}

function assignCategories(selector: string, categories: ProductCategoryResult[]): void {
    const tiles = [...document.querySelectorAll<ProductCategoryTile>(selector)];
    tiles.forEach((tile, index) => {
        tile.productCategory = categories[index];
    });
}

const fashionImage = image('Fashion', '#c026d3', '#7c3aed');
const gardenImage = image('Garden', '#059669', '#0f766e');
const electronicsImage = image('Electronics', '#2563eb', '#0f172a');

assignCategories('#compact-grid relewise-product-category-tile', [
    category('compact-1', 'Women'),
    category('compact-2', 'Men'),
    category('compact-3', 'Children and babies'),
    category('compact-4', 'Sale'),
]);

assignCategories('#mixed-grid relewise-product-category-tile', [
    category('mixed-1', 'Fashion', fashionImage),
    category('mixed-2', 'Books without artwork'),
    category('mixed-3', 'Garden and outdoor living', gardenImage),
    category('mixed-4', 'Gift cards without artwork'),
]);

const paginationGrid = document.querySelector<HTMLElement>('#pagination-grid')!;
const loadMoreButton = document.querySelector<HTMLButtonElement>('#load-more')!;
const resetButton = document.querySelector<HTMLButtonElement>('#reset')!;
const paginationStatus = document.querySelector<HTMLElement>('#pagination-status')!;

const firstPage = [
    category('page-1', 'Existing category 1'),
    category('page-2', 'Existing category 2'),
    category('page-3', 'Existing category 3'),
    category('page-4', 'Existing category 4'),
    category('page-5', 'Existing category 5'),
    category('page-6', 'Existing category 6'),
];

function appendTile(result: ProductCategoryResult): void {
    const tile = document.createElement('relewise-product-category-tile');
    tile.productCategory = result;
    paginationGrid.append(tile);
}

function resetPagination(): void {
    paginationGrid.replaceChildren();
    firstPage.forEach(appendTile);
    loadMoreButton.disabled = false;
    paginationStatus.textContent = 'Six compact results loaded. The second row is currently incomplete.';
}

loadMoreButton.addEventListener('click', () => {
    appendTile(category('page-7', 'Electronics appears on page 2', electronicsImage));
    appendTile(category('page-8', 'Another category without artwork'));
    loadMoreButton.disabled = true;
    paginationStatus.textContent = 'Page 2 appended. The completed first row stayed compact; only the shared second row grew and remains aligned.';
});

resetButton.addEventListener('click', resetPagination);
resetPagination();
