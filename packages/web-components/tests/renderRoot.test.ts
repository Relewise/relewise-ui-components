import { assert, fixture, html } from '@open-wc/testing';
import { ProductResult } from '@relewise/client';
import { Button, ChecklistStringValueFacet, Facets, initializeRelewiseUI, ProductSearchBar, ProductSearchResults, ProductTile } from '../src';
import { clearRegisteredLightDomStylesForTesting } from '../src/lightDomStyles';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

function product(): ProductResult {
    return {
        productId: 'product-1',
        rank: 1,
        displayName: 'Test product',
        salesPrice: 10,
        listPrice: 12,
        data: {
            Url: {
                type: 'String',
                isCollection: false,
                value: '/products/test-product',
            },
        },
    } as ProductResult;
}

suite('domMode', () => {
    setup(() => {
        clearRegisteredLightDomStylesForTesting();
    });

    test('renders into shadow DOM by default', async() => {
        initializeRelewiseUI(mockRelewiseOptions()).useRecommendations();

        const el = await fixture<ProductTile>(html`<relewise-product-tile .product=${product()}></relewise-product-tile>`);
        await el.updateComplete;

        assert.exists(el.shadowRoot);
        assert.exists(el.shadowRoot!.querySelector('.rw-tile'));
        assert.notExists(el.querySelector('.rw-tile'));
    });

    test('renders into light DOM when configured', async() => {
        const options = mockRelewiseOptions();
        options.components = {
            domMode: 'light',
        };
        initializeRelewiseUI(options).useRecommendations();

        const wrapper = await fixture<HTMLElement>(html`
            <div>
                <style>
                    relewise-product-tile .rw-tile {
                        color: rgb(1, 2, 3);
                    }
                </style>
                <relewise-product-tile .product=${product()}></relewise-product-tile>
            </div>
        `);
        const el = wrapper.querySelector('relewise-product-tile') as ProductTile;
        await el.updateComplete;

        assert.notExists(el.shadowRoot);
        const tile = el.querySelector('.rw-tile') as HTMLElement;
        assert.exists(tile);
        assert.equal(getComputedStyle(tile).color, 'rgb(1, 2, 3)');
        const style = document.querySelector('#relewise-light-dom-styles');
        assert.include(style?.textContent, 'relewise-product-tile .rw-tile');
    });

    test('does not register light DOM styles when styling is none', async() => {
        const options = mockRelewiseOptions();
        options.components = {
            domMode: 'light',
            styling: 'none',
        };
        initializeRelewiseUI(options).useRecommendations();

        const el = await fixture<ProductTile>(html`<relewise-product-tile .product=${product()}></relewise-product-tile>`);
        await el.updateComplete;
        const style = document.querySelector('#relewise-light-dom-styles');

        assert.notExists(el.shadowRoot);
        assert.notInclude(style?.textContent ?? '', 'relewise-product-tile .rw-tile');
    });

    test('keeps shadow DOM styles when styling is none', async() => {
        const options = mockRelewiseOptions();
        options.components = {
            styling: 'none',
        };
        initializeRelewiseUI(options).useRecommendations();

        const el = await fixture<ProductTile>(html`<relewise-product-tile .product=${product()}></relewise-product-tile>`);
        await el.updateComplete;

        assert.exists(el.shadowRoot);
        assert.isAbove(el.shadowRoot!.adoptedStyleSheets.length, 0);
    });

    test('renders customer product templates into queryable light DOM', async() => {
        const options = mockRelewiseOptions();
        options.components = {
            domMode: 'light',
        };
        options.templates = {
            product: (product, { html }) => html`<article class="customer-product-template">${product.displayName}</article>`,
        };
        initializeRelewiseUI(options).useRecommendations();

        const el = await fixture<ProductTile>(html`<relewise-product-tile .product=${product()}></relewise-product-tile>`);
        await el.updateComplete;

        assert.equal(el.querySelector('.customer-product-template')?.textContent, 'Test product');
    });

    test('renders button light DOM children inside the button element', async() => {
        const options = mockRelewiseOptions();
        options.components = {
            domMode: 'light',
        };
        initializeRelewiseUI(options).useSearch();

        const el = await fixture<Button>(html`
            <relewise-button>
                <span class="button-child">Load More</span>
            </relewise-button>
        `);
        await el.updateComplete;

        assert.exists(el.querySelector('button .rw-button-text .button-child'));
        assert.notExists(el.querySelector('button .rw-button-icon .button-child'));
        assert.equal(el.querySelector('button .button-child')?.textContent?.trim(), 'Load More');
    });

    test('does not render empty button icon wrapper in light DOM', async() => {
        const options = mockRelewiseOptions();
        options.components = {
            domMode: 'light',
        };
        initializeRelewiseUI(options).useSearch();

        const el = await fixture<Button>(html`<relewise-button button-text="Show More"></relewise-button>`);
        await el.updateComplete;

        assert.equal(el.querySelector('.rw-button-text')?.textContent, 'Show More');
        assert.notExists(el.querySelector('.rw-button-icon'));
    });

    test('registers explicit button border radius in light DOM', async() => {
        const options = mockRelewiseOptions();
        options.components = {
            domMode: 'light',
        };
        initializeRelewiseUI(options).useSearch();

        const el = await fixture<Button>(html`<relewise-button button-text="Show More"></relewise-button>`);
        await el.updateComplete;
        const style = document.querySelector('#relewise-light-dom-styles');

        assert.include(style?.textContent, 'relewise-button .rw-button.rw-border');
        assert.include(style?.textContent, 'border-radius: 0.5em');
    });

    test('registers product search result styles for the spinner-only state', async() => {
        const options = mockRelewiseOptions();
        options.components = {
            domMode: 'light',
        };
        initializeRelewiseUI(options).useSearch();

        const el = await fixture<ProductSearchResults>(html`<relewise-product-search-results></relewise-product-search-results>`);
        await el.updateComplete;
        const style = document.querySelector('#relewise-light-dom-styles');

        assert.exists(el.querySelector('.rw-fill-grid relewise-loading-spinner'));
        assert.include(style?.textContent, 'relewise-product-search-results .rw-fill-grid');
    });

    test('scopes product search bar width to the child search bar host', async() => {
        const options = mockRelewiseOptions();
        options.components = {
            domMode: 'light',
        };
        initializeRelewiseUI(options).useSearch();

        const el = await fixture<ProductSearchBar>(html`<relewise-product-search-bar></relewise-product-search-bar>`);
        await el.updateComplete;
        const style = document.querySelector('#relewise-light-dom-styles');

        assert.include(style?.textContent, 'relewise-product-search-bar > .rw-search-bar');
        assert.notInclude(style?.textContent, 'relewise-product-search-bar .rw-search-bar');
    });

    test('registers compact facet button styles', async() => {
        const options = mockRelewiseOptions();
        options.components = {
            domMode: 'light',
        };
        initializeRelewiseUI(options).useSearch();

        await fixture<Facets>(html`<relewise-facets></relewise-facets>`);
        const style = document.querySelector('#relewise-light-dom-styles');

        assert.include(style?.textContent, 'relewise-facets .rw-facet-button');
        assert.include(style?.textContent, 'relewise-facets .rw-facet-button .rw-button');
        assert.include(style?.textContent, '--button-color: white');
        assert.include(style?.textContent, '--relewise-button-height: auto');
    });

    test('renders checklist show more as a styled relewise button', async() => {
        const options = mockRelewiseOptions();
        options.components = {
            domMode: 'light',
        };
        initializeRelewiseUI(options).useSearch();

        const result = {
            $type: 'Relewise.Client.DataTypes.Search.Facets.Result.ProductDataStringValueFacetResult, Relewise.Client',
            field: 'Color',
            available: Array.from({ length: 11 }, (_, index) => ({
                value: `Color ${index}`,
                hits: index + 1,
                selected: false,
            })),
        };
        const el = await fixture<ChecklistStringValueFacet>(html`
            <relewise-checklist-string-value-facet
                label="Color"
                .result=${result}>
            </relewise-checklist-string-value-facet>
        `);
        await el.updateComplete;
        const style = document.querySelector('#relewise-light-dom-styles');

        assert.equal(el.querySelector('.rw-show-more .rw-button-text')?.textContent?.trim(), 'Show More');
        assert.include(style?.textContent, 'relewise-checklist-string-value-facet .rw-show-more .rw-button');
        assert.include(style?.textContent, 'background-color: white');
        assert.include(style?.textContent, 'border-color: var(--relewise-checklist-facet-border-color, #eee)');
    });
});
