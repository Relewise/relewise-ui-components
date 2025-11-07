# Relewise UI Component [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE) [![npm version](https://img.shields.io/npm/v/@relewise%2Fweb-components.svg)](https://badge.fury.io/js/@relewise%2Fweb-components) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Relewise/relewise-ui-components/pulls)

## Installation 

Install via NPM or your preferred package manager: 

```W
npm install @relewise/web-components
```

## Initialising
In order to use the web component, you need to configure RelewiseUI.
```ts
initializeRelewiseUI(
    {
        contextSettings: {
            getUser: () => {
                return UserFactory.anonymous();
            },
            language: 'da-dk',
            currency: 'DKK',
        },
        datasetId: RELEWISE_DATASET_ID,
        apiKey: RELEWISE_API_KEY,
        clientOptions: {
            serverUrl: RELEWISE_SERVER_URL,
        },
    });
```

Replace the `RELEWISE_DATASET_ID`, `RELEWISE_API_KEY`, `RELEWISE_SERVER_URL` with your dataset, api-key and server-url found at [My.Relewise](https://my.relewise.com/developer-settings). 

After which you have access to various components configured with the configuration provided.
### Updating Context Settings
To update Context Settings after initialization simply call updateContextSettings.
```ts
updateContextSettings({
    language: 'fr-be',
    currency: 'EUR',
});
```
Components depending on Context Settings will re-render once settings have been updated.

## Configuring Relewise Client
You are required to configure the client that you use to call Relewise. Provide the following configuration during initialization.

The main purpose of the client options is to configure which Relewise server to call. These are almost always different between development and production environments.
```ts
initializeRelewiseUI(
    {
        ...
        clientOptions: {
            serverUrl: RELEWISE_SERVER_URL,
        },
    });
```

## Rendering components

Some components can be set with attributes that specify the behavior of the specific component.

To render a specific component you simply use the corresponding html tag.

E.g. the `relewise-purchased-with-product` takes in an attribute `product-id` specifying which product the recommendations should be based on. 
```html
<relewise-purchased-with-product product-id="PRODUCT_ID"></relewise-purchased-with-product>
```
Replace the `PRODUCT_ID` with your own product's id.

### Recommendations
Call the useRecommendations function to start rendering recommendation components.
 ```ts
useRecommendations();
```

This can also be done fluently when initializing relewise UI.
 ```ts
initializeRelewiseUI().useRecommendations();
```

#### Popular Products
This component renders the most [popular products](https://docs.relewise.com/docs/recommendations/recommendation-types.html#popular-products).

```html
<relewise-popular-products displayed-at-location="LOCATION"></relewise-popular-products>
```
##### Attributes
- **displayed-at-location** : 
    
    Where the recommendations are being shown. 
    
    For more information see our [docs](https://docs.relewise.com/docs/developer/bestpractice.html#_4-recommendation-requests).
    
- **number-of-recommendations** (Optional, *Default 4*): 
    
    The amount of products to render.

- **since-minutes-ago** (Optional, *Default 20160 - 14 days*):
    
    The time interval, in minutes, that the popularity calculation should be based on.

- **based-on** (Optional, *Default MostPurchased*):

    possible values: MostPurchased, MostViewed 

    The type of behavioral data that recommendations should be based on.

- **target** (Optional):

    The target for the additional specific configuration added. You can read more [here](#targeted-recommendations).

#### Products viewed after viewing Product
This component renders [products typically viewed after viewing a given product](https://docs.relewise.com/docs/recommendations/recommendation-types.html#products-viewed-after-viewing-product).

```html
<relewise-products-viewed-after-viewing-product product-id="PRODUCT_ID" displayed-at-location="LOCATION"></relewise-products-viewed-after-viewing-product>
```
##### Attributes
- **displayed-at-location** : 
    
    Where the recommendations are being shown. 
    
    For more information, see our [docs](https://docs.relewise.com/docs/developer/bestpractice.html#_4-recommendation-requests).

- **product-id**:
    
    The id of the product the recommendations should be based on.

- **variant-id** (Optional):
    
    The id of the product variant the recommendations should be based on.

- **number-of-recommendations** (Optional, *Default 4*): 

    The number of product recommendations to render.

- **target** (Optional):

    The target for the additional specific configuration added. You can read more [here](#targeted-recommendations).

#### Products viewed after viewing Content
This component renders [products typically viewed after viewing a given piece of content](https://docs.relewise.com/docs/recommendations/recommendation-types.html#products-viewed-after-viewing-content).

```html
<relewise-products-viewed-after-viewing-content content-id="CONTENT_ID" displayed-at-location="LOCATION"></relewise-products-viewed-after-viewing-content>
```
##### Attributes
- **displayed-at-location** : 
    
    Where the recommendations are being shown. 
    
    For more information, see our [docs](https://docs.relewise.com/docs/developer/bestpractice.html#_4-recommendation-requests).

- **content-id**:
    
    The id of the content the recommendations should be based on.

- **number-of-recommendations** (Optional, *Default 4*): 

    The number of product recommendations to render.

- **target** (Optional):

    The target for the additional specific configuration added. You can read more [here](#targeted-recommendations).

#### Products purchased with Product
This component renders [products typically purchased with a given product](https://docs.relewise.com/docs/recommendations/recommendation-types.html#purchased-with-product).

```html
<relewise-purchased-with-product product-id="PRODUCT_ID" displayed-at-location="LOCATION"></relewise-purchased-with-product>
```
##### Attributes
- **displayed-at-location** : 
    
    Where the recommendations are being shown. 
    
    For more information see our [docs](https://docs.relewise.com/docs/developer/bestpractice.html#_4-recommendation-requests).

- **product-id**:
    
    The id of the product the recommendations should be based on.

- **variant-id** (Optional):
    
    The id of the product variant the recommendations should be based on.

- **number-of-recommendations** (Optional, *Default 4*): 

    The number of products recommendations to render.

- **target** (Optional):

    The target for the additional specific configuration added. You can read more [here](#targeted-recommendations).

#### Products Purchased with Multiple Products
This component renders [products purchased with multiple products](https://docs.relewise.com/docs/recommendations/recommendation-types.html#purchased-with-multiple-products).

The recommendation requires child elements specifying which products and, optionally, variants to base the recommendation on.

```html
<relewise-purchased-with-multiple-products displayed-at-location="LOCATION">
    <product-and-variant-id product-id="PRODUCT_ID"></product-and-variant-id>
    <product-and-variant-id product-id="PRODUCT_ID" variant-id="VARIANT_ID"></product-and-variant-id>
</relewise-purchased-with-multiple-products>
```
##### Attributes product-and-variant-id
- **product-id**:
    
    The id of the product the recommendations should be based on.

- **variant-id** (Optional):
    
    The id of the product variant the recommendations should be based on.

##### Attributes relewise-purchased-with-multiple-products
- **displayed-at-location** : 
    
    Where the recommendations are being shown. 
    
    For more information see our [docs](https://docs.relewise.com/docs/developer/bestpractice.html#_4-recommendation-requests).

- **number-of-recommendations** (Optional, *Default 4*): 

    The number of products recommendations to render.

- **target** (Optional):

    The target for the additional specific configuration added. You can read more [here](#targeted-recommendations).

#### Personal Products
This component renders [personal products](https://docs.relewise.com/docs/recommendations/recommendation-types.html#personal-product).

```html
<relewise-personal-products displayed-at-location="LOCATION"></relewise-personal-products>
```
##### Attributes
- **displayed-at-location** : 
    
    Where the recommendations are being shown. 
    
    For more information see our [docs](https://docs.relewise.com/docs/developer/bestpractice.html#_4-recommendation-requests).
    
- **number-of-recommendations** (Optional, *Default 4*): 
    
    The amount of products to render.

#### Recently Viewed Products
This component renders [recently viewed products](https://docs.relewise.com/docs/recommendations/recommendation-types.html#recently-viewed-products).
The component will only render results for users who can be identified through tracking. This requires that the user has been tracked with at least an email, identifier, authenticated ID or temporary ID.

```html
<relewise-recently-viewed-products displayed-at-location="LOCATION"></relewise-recently-viewed-products>
```
##### Attributes
- **displayed-at-location** : 
    
    Where the recommendations are being shown. 
    
    For more information see our [docs](https://docs.relewise.com/docs/developer/bestpractice.html#_4-recommendation-requests).
    
- **number-of-recommendations** (Optional, *Default 4*): 
    
    The amount of products to render.

#### Product Recommendation Batcher
This component batches multiple product recommendations into a single request against Relewise.
This increases performance, and ensures that there are no duplicate products in the recommendation sliders

```html
<relewise-product-recommendation-batcher>
    <h1>Purchased with</h1>
    <relewise-purchased-with-product product-id="PRODUCT_ID" displayed-at-location="LOCATION"></relewise-purchased-with-product>

    <h1>Viewed after viewing</h1>
    <relewise-products-viewed-after-viewing-product product-id="PRODUCT_ID" displayed-at-location="LOCATION"></relewise-products-viewed-after-viewing-product>
</relewise-product-recommendation-batcher>
```

#### Popular Content
This component renders [popular content](https://docs.relewise.com/docs/recommendations/recommendation-types.html#popular-content).

```html
<relewise-popular-content displayed-at-location="LOCATION"></relewise-popular-content>
```
##### Attributes
- **displayed-at-location** : 
    
    Where the recommendations are being shown. 
    
    For more information see our [docs](https://docs.relewise.com/docs/developer/bestpractice.html#_4-recommendation-requests).
    
- **number-of-recommendations** (Optional, *Default 4*): 
    
    The number of content recommendations to render.

- **since-minutes-ago** (Optional, *Default 20160 - 14 days*):
    
    The time interval, in minutes, that the popularity calculation should be based on.

- **target** (Optional):

    The target for the additional specific configuration added. You can read more [here](#targeted-recommendations).

#### Personal Content
This component renders [personal content](https://docs.relewise.com/docs/recommendations/recommendation-types.html#personal-content).

```html
<relewise-personal-content displayed-at-location="LOCATION"></relewise-personal-content>
```
##### Attributes
- **displayed-at-location** : 
    
    Where the recommendations are being shown. 
    
    For more information see our [docs](https://docs.relewise.com/docs/developer/bestpractice.html#_4-recommendation-requests).
    
- **number-of-recommendations** (Optional, *Default 4*): 
    
    The number of content recommendations to render.

- **target** (Optional):

    The target for the additional specific configuration added. You can read more [here](#targeted-recommendations).

#### Content Viewed After Viewing Content
This component renders [content typically viewed after viewing a given content page](https://docs.relewise.com/docs/recommendations/recommendation-types.html#content-viewed-after-viewing-content).

```html
<relewise-content-viewed-after-viewing-content content-id="CONTENT_ID" displayed-at-location="LOCATION"></relewise-content-viewed-after-viewing-content>
```
##### Attributes
- **displayed-at-location** : 
    
    Where the recommendations are being shown. 
    
    For more information see our [docs](https://docs.relewise.com/docs/developer/bestpractice.html#_4-recommendation-requests).

- **content-id**:
    
    The id of the content item the recommendations should be based on.

- **number-of-recommendations** (Optional, *Default 4*): 

    The number of content recommendations to render.

- **target** (Optional):

    The target for the additional specific configuration added. You can read more [here](#targeted-recommendations).

#### Content Viewed After Viewing Multiple Content
This component renders [content typically viewed after viewing multiple content pages](https://docs.relewise.com/docs/recommendations/recommendation-types.html#content-viewed-after-viewing-multiple-content).

```html
<relewise-content-viewed-after-viewing-multiple-content displayed-at-location="LOCATION">
    <content-id content-id="CONTENT_ID"></content-id>
    <content-id content-id="ANOTHER_CONTENT_ID"></content-id>
</relewise-content-viewed-after-viewing-multiple-content>
```
##### Attributes
- **displayed-at-location** : 
    
    Where the recommendations are being shown. 
    
    For more information see our [docs](https://docs.relewise.com/docs/developer/bestpractice.html#_4-recommendation-requests).

- **number-of-recommendations** (Optional, *Default 4*): 

    The number of content recommendations to render.

- **target** (Optional):

    The target for the additional specific configuration added. You can read more [here](#targeted-recommendations).

##### Child elements
- `<content-id content-id="CONTENT_ID">`:

    Provide one child per content item that the recommendation should be based on. The `content-id` attribute holds the id of the content.

#### Content Viewed After Viewing Product
This component renders [content typically viewed after viewing a given product](https://docs.relewise.com/docs/recommendations/recommendation-types.html#content-viewed-after-viewing-product).

```html
<relewise-content-viewed-after-viewing-product product-id="PRODUCT_ID" displayed-at-location="LOCATION"></relewise-content-viewed-after-viewing-product>
```
##### Attributes
- **displayed-at-location** : 
    
    Where the recommendations are being shown. 
    
    For more information see our [docs](https://docs.relewise.com/docs/developer/bestpractice.html#_4-recommendation-requests).

- **product-id**:
    
    The id of the product the recommendations should be based on.

- **variant-id** (Optional):
    
    The id of the product variant the recommendations should be based on.

- **number-of-recommendations** (Optional, *Default 4*): 

    The number of content recommendations to render.

- **target** (Optional):

    The target for the additional specific configuration added. You can read more [here](#targeted-recommendations).

#### Content Viewed After Viewing Multiple Products
This component renders [content typically viewed after viewing multiple products](https://docs.relewise.com/docs/recommendations/recommendation-types.html#content-viewed-after-viewing-multiple-products).

```html
<relewise-content-viewed-after-viewing-multiple-products displayed-at-location="LOCATION">
    <product-and-variant-id product-id="PRODUCT_ID"></product-and-variant-id>
    <product-and-variant-id product-id="SECOND_PRODUCT_ID" variant-id="VARIANT_ID"></product-and-variant-id>
</relewise-content-viewed-after-viewing-multiple-products>
```
##### Attributes
- **displayed-at-location** : 
    
    Where the recommendations are being shown. 
    
    For more information see our [docs](https://docs.relewise.com/docs/developer/bestpractice.html#_4-recommendation-requests).

- **number-of-recommendations** (Optional, *Default 4*): 

    The number of content recommendations to render.

- **target** (Optional):

    The target for the additional specific configuration added. You can read more [here](#targeted-recommendations).

##### Child elements
- `<product-and-variant-id product-id="PRODUCT_ID" variant-id="VARIANT_ID">`:

    Provide one child per product the recommendation should be based on. The `product-id` attribute is required, while `variant-id` is optional.

#### Targeted Recommendations
You can target specific recommendations to ensure certain filters and/or relevance modifiers are only applied to the target. This can be done by calling `registerRecommendationTarget` either during initialization or afterwards by calling the function independently.


```ts
initializeRelewiseUI(
    {
        ...
        targets: {
            recommendationTargets(builder) {
                builder.add({target: 'target', configuration: {
                    filters(filterBuilder) {
                        filterBuilder.addProductCategoryIdFilter('ImmediateParent', ['4774']);
                    },
                    relevanceModifiers(builder) {
                        builder.addBrandIdRelevanceModifier('brand1', 1000);
                    },
                }});
            },
        },
    },
);
```

```ts
registerRecommendationTarget('target', {
    filters(builder) {
        builder.addProductCategoryIdFilter('ImmediateParent', ['4774']);
    },
    relevanceModifiers(builder) {
        builder.addBrandIdRelevanceModifier('brand1', 1000);
    },
});
```

To specify which recommendation component the configuration should be applied to, simply add the target attribute to the component.

```html
<relewise-popular-products target="target"></relewise-popular-products>
```

***Note: The target must match the target specified when calling `registerRecommendationTarget`!***

### Search
Call the useSearch function to start rendering search components.
```ts
useSearch();
```

To specify which filters should be used when searching, call the useSearch function with a configuration.

*Note: These filters will be applied on top of the filters defined when initializing Relewise UI.*
```ts
useSearch({
    filters: {
        productSearch: (builder) => {
            builder
                .addProductCategoryIdFilter('ImmediateParent', ['category'])
                .addBrandIdFilter(['brand1', 'brand2'])
                .addProductAssortmentFilter(1);
        },
    }
});
```

#### Localization
To overwrite words and sentences used by the search components, call the `useSearch` function with the desired localization configuration.

```ts
useSearch({
    localization: {
        facets: {
            save: 'Save',
            showLess: 'Show Less',
            showMore: 'Show More',
            toggle: 'Filter',
            yes: 'Yes',
            no: 'No'
        },
        loadMoreButton: {
            loadMore: 'Hent flere!',
            showing: 'Viser',
            outOf: 'ud af',
            products: 'produkter',
        },
        searchBar: {
            placeholder: 'Search',
            search: 'Search',
        },
        searchResults: {
            noResults: 'No products found',
            showAllResults: 'Show all results',
            result: "Result";
            results: "Results";
        },
        sortingButton: {
            sorting: 'sorting',
            sortBy: "Sort by:"
            alphabeticalAscending: 'a - z',
            alphabeticalDescending: 'z - a',
            relevance: 'Relevance',
            salesPriceAscending: 'low - high',
            salesPriceDescending: 'high - low',
        },
    },
});
```

#### Product Search Overlay
This component renders a search bar that will [search for products](https://docs.relewise.com/docs/intro/search.html#product-search) in Relewise and show results in an overlay.

Search Redirects is supported in the product search overlay, by default we redirect the user on "Enter", when a Redirect matches the search term.
If you want the Redirects listed as suggestions, you can add a "Title" data entry on the Redirect to get them shown.

```html
<relewise-product-search-overlay displayed-at-location="LOCATION"></relewise-product-search-overlay>
```
The component renders products but does not use the default product template.

To overwrite the template used in this specific component, call the useSearch function with the templates option.
```ts
useSearch({
    filters: { ... },
    templates: {
        searchOverlayProductResult: (product, { html, helpers }) => {
            return html`<!-- Write your template here -->`;
        },
    }
});
```

##### Attributes

- **displayed-at-location** : 
    
    Where the search bar is being shown. 
    
    For more information see our [docs](https://docs.relewise.com/docs/developer/bestpractice.html#_6-making-search-requests).

- **number-of-products** (Optional, *Default 5*): 

    The number of products shown in the results overlay.

- **number-of-search-term-predictions** (Optional, *Default 3*): 

    The number of search term predictions shown in the results overlay.

- **search-page-url** (Optional): 

    The url of your search page. When provided, an option to go to the search page will be present, when results are found.

- **debounce-time** (Optional, *Default 250*): 

    The amount of time, in milliseconds, that must pass between requests to Relewise with a new search call.

- **autofocus** (Optional, true/false):

    Toggle whether or not the input field should be focused on load.

#### Product Search
This component renders a search component that [searches for products](https://docs.relewise.com/docs/intro/search.html#product-search) in Relewise and shows results, faceting and sorting options.

```html
<relewise-product-search displayed-at-location="LOCATION"></relewise-product-search>
```

##### Attributes

- **displayed-at-location** : 
    
    Where the search component is being shown. 
    
    For more information see our [docs](https://docs.relewise.com/docs/developer/bestpractice.html#_6-making-search-requests).

- **number-of-products** (Optional, *Default 16*): 

    The number of products to search for initially.

- **debounce-time** (Optional, *Default 250*): 

    The amount of time, in milliseconds, that must pass between requests to Relewise with a new search call.

- **target** (Optional):

    The target for the additional specific configuration added. You can read more [here](#targeted-search).

#### Styling the component

Several parts of the search-overlay are exposed via parts, that allow you some easy hooks to customize how the component looks.

```css
relewise-product-search-overlay::part(searchbar) {
    ...
}

relewise-product-search-overlay::part(searchbar-input) {
    ...
}

relewise-product-search-overlay::part(searchbar-icon) {
    ...
}

relewise-product-search-overlay::part(overlay) {
    ...
}

relewise-product-search-overlay::part(overlay-container) {
    ...
}

relewise-product-search-overlay::part(overlay-title) {
    ...
}

relewise-search-bar::part(input) {
    ...
}
```


#### Scroll position
When the user navigates to another page or leaves the site, the component will by default not remember where the user last scrolled to.

This can be toggled to do so, to ensure a smooth transition when the user returns back to the site.

This setting is part of the configuration supplied to the `useSearch` function.

```ts
useSearch({
    rememberScrollPosition: true
});
```

#### Exploded Variants
This allows you to control how many variants you want returned, if they match the search term, for both the search overlay and the product search.

This setting is part of the configuration supplied to the `useSearch` function.

```ts
useSearch({
    explodedVariants: 1
});
```

#### Facets
By default the component will not render any facets.

To start doing so, include your facet configuration in the `useSearch` function.

The label will be displayed at the top of the facet card.

```ts
useSearch({
    facets: {
        product(builder) {
            builder
                .addFacet((f) => f.addBrandFacet(), { heading: 'Brands' })
                .addFacet((f) => f.addCategoryFacet('ImmediateParent'), { heading: 'Categories' })
                .addFacet((f) => f.addSalesPriceRangeFacet('Product'), { heading: 'Sales Price' });
        },
    }
});
```
#### Layout
To overwrite the layout of the components, include the components inside the `relewise-product-search` html tag.

Every tag inside the `relewise-product-search` html tag, will be rendered as regular html so you can expand the content as needed and create your own layout.

```html
<relewise-product-search displayed-at-location="LOCATION">
    <relewise-product-search-bar></relewise-product-search-bar>
    <div>
        <relewise-product-search-sorting></relewise-product-search-sorting>
    </div>
    <div>
        <relewise-facets></relewise-facets>
        <hr>
        <h1>Results</h1>
        <div>
            <relewise-product-search-results></relewise-product-search-results>
            <relewise-product-search-load-more-button></relewise-product-search-load-more-button>
        </div>
    </div>
</relewise-product-search>
```

***Note: once including your own layout nothing from the default layout will be rendered!***

#### Styling the component

We also expose parts, that allow you some easy hooks to customize how the components looks.

```css
relewise-product-search::part(sorting-select) {
    ...
}

relewise-product-search::part(sorting-label) {
    ...
}

relewise-product-search::part(facet-container) {
    ...
}

relewise-product-search::part(facet-title) {
    ...
}

relewise-product-search::part(facet-hits) {
    ...
}

relewise-product-search::part(facet-value) {
    ...
}

relewise-product-search::part(facet-input) {
    ...
}
```

##### Components
These components are all included in the default layout and can also be used in custom layouts.

You do not have to worry about setting data on these components, this is handled internally by the Product Search component.

###### Search bar
Renders a search bar with a search button.

The component will search as the user types or presses the search button.

```html
<relewise-product-search-bar></relewise-product-search-bar>
```

###### Sorting
Renders a sorting button with options in an overlay.

```html
<relewise-product-search-sorting></relewise-product-search-sorting>
```

###### Facets
This component renders facets configured in the `useSearch` function.

On smaller screens, this component will also include a button to toggle the visibility of the facet cards.

```html
<relewise-facets></relewise-facets>
```

###### Product search results
Renders a grid of product tiles.

To overwrite the default product tile, [call the initialise function with the desired template](#template-overwriting). 

```html
<relewise-product-search-results></relewise-product-search-results>
```

###### Product search results
Renders button that will load more results once pressed.

```html
<relewise-product-search-load-more-button></relewise-product-search-load-more-button>
```

#### Targeted Search
You can target specific search components to ensure certain filters and/or relevance modifiers are only applied to the target and overwrite the facets used. This can be done by calling `registerSearchTarget` either during initialization or afterwards by calling the function independently.

```ts
initializeRelewiseUI(
    {
        ...
        targets: {
            searchTargets(builder) {
                builder.add({
                    target: 'target',
                    configuration: {
                        overwriteFacets(facetBuilder) {
                            facetBuilder.addFacet((f) => f.addSalesPriceRangeFacet('Product'), { heading: 'Sales price' });
                        },
                        filters(filterBuilder) {
                            filterBuilder.addProductCategoryIdFilter('ImmediateParent', ['4797']);
                        },
                        relevanceModifiers(builder) {
                            builder.addBrandIdRelevanceModifier('brand1', 1000);
                        },
                    },
                });
            },
        },
    },
);
```

```ts
registerSearchTarget('target', {
    overwriteFacets(builder) {
        builder.addFacet((f) => f.addSalesPriceRangeFacet('Product'), { heading: 'Sales price' });
    },
    filters(builder) {
        builder.addProductCategoryIdFilter('ImmediateParent', ['4797']);
    },
    relevanceModifiers(builder) {
        builder.addBrandIdRelevanceModifier('brand1', 1000);
    },
});
```

To specify which search component the configuration should be applied to, simply add the target attribute to the component.

```html
<relewise-product-search target="target"></relewise-product-search>
```

***Note: The target must match the target specified when calling `registerSearchTarget`!***

## Overwriting styling
If you want to overwrite the styling of the grid and the default product tile, you can do so by using CSS variables.

We define a CSS custom property `--relewise-base-font-size` on the component host. All typography and spacing inside the component use `em` units relative to this base. This ensures that the component scales consistently, while still allowing the base font size to be overridden from the outside if needed.

### CSS custom properties
All CSS variables recognised by the web components are listed below together with their default values and purpose. Override the tokens that make sense for your design system and the rest of the styles will follow.

#### Global tokens
| Variable | Default | Description |
| --- | --- | --- |
| `--relewise-base-font-size` | `16px` | Base font size applied to every component host. |
| `--relewise-font` | `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"` | Primary font stack for all typography. |
| `--relewise-color` | `#eee` | Neutral colour used for backgrounds, borders and subtle text. |
| `--relewise-accent-color` | `#3764e4` | Accent colour for buttons, focus rings and highlights. |
| `--relewise-border` | `1px solid` | Default border style used across the components. |
| `--relewise-border-radius` | `1em` | Standard border radius for rounded UI elements. |
| `--relewise-hover-color` | `whitesmoke` | Background colour for hover and selection states. |

#### Icons
| Variable | Default | Description |
| --- | --- | --- |
| `--relewise-icon-color` | Matches `--color` | Fill and stroke colour for all icon components. |
| `--relewise-x-icon-color` | Matches `--color` | Specific icon colour used by the clear (`x`) icon. |
| `--relewise-icon-width` | `1rem` | Width of all SVG icons. |
| `--relewise-icon-height` | `1rem` | Height of all SVG icons. |

#### Buttons and interactive controls
| Variable | Default | Description |
| --- | --- | --- |
| `--relewise-button-height` | `3em` | Height of the shared button style. |
| `--relewise-button-font-size` | `1em` | Font size used for button labels. |
| `--relewise-button-text-color` | `#333` | Text colour for buttons and other interactive text. |
| `--relewise-button-text-font-weight` | `600` | Font weight of button labels. |
| `--relewise-button-border-color` | `#eee` | Border colour for outlined buttons. |
| `--relewise-button-icon-padding` | `0.3em .8em` | Horizontal padding applied when buttons render icons. |
| `--button-color` | `white` (buttons) / `#f9f9f9` (facet cards) | Background colour for elements that inherit the shared button style. |
| `--relewise-sorting-button-container-display` | `flex` | Layout mode of the product sorting control container. |
| `--relewise-sorting-button-margin-left` | `auto` | Left margin applied to push the sorting control to the edge. |
| `--relewise-product-search-sorting-padding` | `.5em` | Padding for the sorting `<select>` element. |

#### Product tiles and pricing
| Variable | Default | Description |
| --- | --- | --- |
| `--relewise-image-padding` | `0` | Padding around product images. |
| `--relewise-image-background-color` | `#fff` | Background colour for the image placeholder. |
| `--relewise-image-align` | `center` | Alignment of the image container content. |
| `--relewise-information-container-margin` | `0.5em 0.5em` | Margin around the information section of the tile. |
| `--relewise-image-width` | `100%` | Maximum width of product images. |
| `--relewise-image-height` | `auto` | Height of product images. |
| `--relewise-display-name-letter-spacing` | `-0.025em` | Letter spacing used for product names. |
| `--relewise-display-name-alignment` | `start` | Horizontal alignment of the product name. |
| `--relewise-display-name-color` | `#212427` | Text colour of the product name. |
| `--relewise-display-name-line-height` | `1` (line height) / `1.1em` (tile height calculation) | Line height controlling how many lines of the name are shown. |
| `--relewise-display-name-font-weight` | `500` | Font weight of the product name. |
| `--relewise-display-name-font-size` | `1em` | Font size of the product name. |
| `--relewise-display-name-margin` | `0em 0em 0em 0em` | Margin around the product name element. |
| `--relewise-sales-price-font-weight` | `300` | Font weight of the sales price. |
| `--relewise-sales-price-font-size` | `1em` | Font size of the sales price. |
| `--relewise-sales-price-color` | `#212427` | Text colour of the sales price. |
| `--relewise-sales-price-alignment` | `start` | Alignment of the sales price container. |
| `--relewise-sales-price-margin` | `1em 0em 0em 0em` | Margin surrounding the sales price area. |
| `--relewise-list-price-font-size` | `1em` | Font size of the list price. |
| `--relewise-list-price-text-decoration` | `line-through` | Decoration applied to the list price. |
| `--relewise-list-price-color` | `#bbb` | Text colour of the list price. |
| `--relewise-list-price-margin` | `0em 0em 0em 0.5em` | Margin around the list price element. |

#### Search bars and layout
| Variable | Default | Description |
| --- | --- | --- |
| `--relewise-product-search-bar-margin-top` | `.5em` | Top margin applied to the product search bar. |
| `--relewise-product-search-bar-margin-bottom` | `.5em` | Bottom margin applied to the product search bar. |
| `--relewise-product-search-bar-width` | `100%` | Width of the product search bar container. |
| `--relewise-product-search-bar-height` | `3em` | Height of the product search bar input. |
| `--relewise-search-bar-border-color` | `var(--color)` | Border colour of the search input in its default state. |
| `--relewise-search-bar-border-color-focused` | `var(--accent-color)` | Border colour of the search input when focused. |

#### Search overlay container and messaging
| Variable | Default | Description |
| --- | --- | --- |
| `--relewise-product-search-overlay-background-color` | `white` | Background colour of the overlay container. |
| `--relewise-product-search-overlay-border-color` | `#ddd` | Border colour of the overlay container. |
| `--relewise-product-search-overlay-box-shadow` | `0 10px 15px rgb(0 0 0 / 0.2)` | Shadow applied to the overlay container. |
| `--relewise-product-search-overlay-no-results-message-font-weight` | `300` | Font weight for the “no results” message. |
| `--relewise-product-search-overlay-no-results-message-color` | `#212427` | Text colour of the “no results” message. |
| `--relewise-product-search-result-overlay-prediction-item-color` | `#212427` | Text colour used by suggested search queries. |
| `--relewise-product-search-overlay-prediction-item-font-weight` | `300` | Font weight for suggested search queries. |
| `--relewise-product-search-overlay-title-padding` | `1em 1em 0.2em 1em` | Padding for titles within the overlay. |
| `--relewise-product-search-overlay-title-font-size` | `0.9em` | Font size for overlay titles. |
| `--relewise-product-search-overlay-title-font-weight` | `500` | Font weight for overlay titles. |

#### Search overlay product and category entries
| Variable | Default | Description |
| --- | --- | --- |
| `--relewise-product-search-result-overlay-product-image-height` | `3em` | Height of product images inside the overlay. |
| `--relewise-product-search-result-overlay-product-image-width` | `3em` | Width of product images inside the overlay. |
| `--relewise-product-search-result-overlay-product-diplay-name-overflow` | `hidden` | Overflow behaviour for product names inside the overlay. |
| `--relewise-product-search-result-overlay-product-diplay-name-text-overflow` | `ellipsis` | Text overflow setting for product names inside the overlay. |
| `--relewise-product-search-result-overlay-product-diplay-name-color` | `#212427` | Text colour for product names inside the overlay. |
| `--relewise-product-search-result-overlay-product-sales-price-font-weight` | `400` | Font weight for sales prices in the overlay. |
| `--relewise-product-search-result-overlay-product-sales-price-font-size` | `0.9em` | Font size for sales prices in the overlay. |
| `--relewise-product-search-result-overlay-product-sales-price-color` | `#212427` | Text colour for sales prices in the overlay. |
| `--relewise-product-search-result-overlay-product-list-price-font-size` | `0.9em` | Font size for list prices in the overlay. |
| `--relewise-product-search-result-overlay-product-list-price-text-decoration` | `line-through` | Decoration applied to list prices in the overlay. |
| `--relewise-product-search-result-overlay-product-list-price-text-color` | `darkgray` | Text colour for list prices in the overlay. |
| `--relewise-product-search-result-overlay-product-category-diplay-name-font-size` | `0.9em` | Font size for category names in the overlay. |
| `--relewise-product-search-result-overlay-product-category-diplay-name-font-weight` | `normal` | Font weight for category names in the overlay. |
| `--relewise-product-search-result-overlay-product-category-diplay-name-overflow` | `hidden` | Overflow behaviour for category names in the overlay. |
| `--relewise-product-search-result-overlay-product-category-diplay-name-color` | `#212427` | Text colour for category names in the overlay. |
| `--relewise-product-search-result-overlay-category-product-category-diplay-name-text-overflow` | `ellipsis` | Text overflow for category names in the overlay. |

#### Facets and filters
| Variable | Default | Description |
| --- | --- | --- |
| `--relewise-checklist-facet-border-color` | `#eee` | Border colour for facet cards. |
| `--relewise-checklist-facet-hits-color` | `gray` | Text colour for facet hit counts. |
| `--relewise-checklist-facet-hits-font-size` | `.85em` | Font size for facet hit counts. |
| `--relewise-number-range-input-height` | `2em` | Height of inputs in the number range facet. |
| `--relewise-number-range-input-width` | `100%` | Width of inputs in the number range facet. |

#### Load more and meta information
| Variable | Default | Description |
| --- | --- | --- |
| `--relewise-load-more-text-size` | `.85em` | Font size of the “load more” button text. |
| `--relewise-load-more-text-color` | `black` | Text colour of the “load more” button. |
| `--relewise-products-shown-color` | `black` | Text colour for the “products shown” label. |
| `--relewise-products-shown-font-size` | `.85em` | Font size for the “products shown” label. |

To override one or more of these variables, apply them in your own stylesheet. For example:

```html
<style>
    :root {
        --relewise-accent-color: #ff4f4f;
        --relewise-button-text-color: #ffffff;
        --relewise-product-search-overlay-background-color: #fdfdfd;
    }
</style>
```

### Content tiles
The default `relewise-content-tile` exposes summary-specific tokens you can override to match your typography palette.

| Variable | Default | Description |
| --- | --- | --- |
| `--relewise-summary-line-height` | `1.2` | Line height for the summary text block. |
| `--relewise-summary-color` | `#666` | Text colour for the summary text block. |

## Properties to render
By default our web components will render some basic information about the product.

Set the `selectedPropertiesSettings` in the initialise function to specify which properties to render.

These properties will also be accessible when [overwriting the default template](#template-overwriting). 
```ts
initializeRelewiseUI(
    {
        ...
        selectedPropertiesSettings: {
            product: {
                displayName: true,
                ...
            },
        },
    });
```

## Filtering
If you need to filter what entities are being shown, you need to initialise RelewiseUI with the correct filter options.

Here is an example of a filter on product recommendations.
```ts
initializeRelewiseUI(
    {
        ...
        filters: {
            product: (builder) => {
                builder
                    .addProductCategoryIdFilter('ImmediateParent', ['category'])
                    .addBrandIdFilter(['brand1', 'brand2'])
                    .addProductAssortmentFilter(1);
            },
        },
    });
```
The builder is a type exposed from the [relewise-sdk-javascript](https://github.com/Relewise/relewise-sdk-javascript).

For more examples and information about filters visit the official [docs](https://docs.relewise.com/).

## Relevance Modifiers
With Relevance Modifiers you can influence the order of entities shown in search and recommendations.

Here is an example of setting up Relevance Modifiers.
```ts
initializeRelewiseUI(
    {
        ...
        relevanceModifiers: {
            product(builder) {
                builder
                    .addBrandIdRelevanceModifier('brand1', 100)
                    .addProductIdRelevanceModifier(['productId1', 'productId2'], 50);
            },
        },
    });
```
The builder is a type exposed from the [relewise-sdk-javascript](https://github.com/Relewise/relewise-sdk-javascript).

For more examples and information about relevance modifiers visit the official [docs](https://docs.relewise.com/).

## Template overwriting
It is possible to overwrite the template used for rendering products and/or content. This is done using [lit templating](https://lit.dev/docs/templates/overview/).
When the template is overwritten, the corresponding tile skips attaching default CSS styles on the tile, so your template has full control over layout and presentation.
If no custom template is provided, it will render using the default template.

### Product template
You can override the product template, which will expose and contain all the data configured, when initialising RelewiseUI.
```ts
initializeRelewiseUI(
    {
        ...
        templates: {
            product: (product, { html, helpers }) => {
                return html`<!-- Write your template here -->`;
            },
        },
    });
```


### Content template
You can override the content template the same way as product templates.

```ts
initializeRelewiseUI({
    ...
    templates: {
        content: (content, { html, helpers }) => html`<!-- Write your template here -->`
    }
});
```

### Styling
Styling the provided template can be done inline, or by including a style tag containing the preferred styles.
```ts
initializeRelewiseUI(
    {
        ...
        templates: {
            product: (product, { html, helpers }) => {
                return html`
                    <style><!-- Write your styled here --></style>
                    <!-- Write your template here -->`;
            }
        }
    });
```

### Helpers
Within custom templates you have access to a `helpers` object:

- `stripHtmlClientSide(text)` – Removes any HTML markup client-side before rendering.
- `formatPrice(value)` – Formats Relewise price values using the current context (product templates only).
- `unsafeHTML` – Exports Lit’s `unsafeHTML` directive for cases where you intentionally inject markup.
- `nothing` – Exports Lit’s `nothing` sentinel for conditional rendering.

These mirror the surface exposed by `templateHelpers` inside the package.

For example, use `helpers.stripHtmlClientSide` to remove any markup from the supplied string before rendering it. This helper only runs when the component executes in a browser; server-side rendering keeps the original string.

```ts
initializeRelewiseUI({
    ...
    templates: {
        content: (content, { html, helpers }) => {
            const summary = content.data?.Summary?.value ?? '';
            return html`
                <div>
                    <p>${helpers.stripHtmlClientSide(summary)}</p>
                </div>`;
        }
    }
});
```

## Tracking
Call the useBehavioralTracking function to start tracking user behavior.
 ```ts
useBehavioralTracking();
```

This can also be done fluently when initializing relewise UI.
 ```ts
initializeRelewiseUI().useBehavioralTracking();
```
These components do not render any html but they do send behavioral tracking data to Relewise.

### Product view
This component sends a [track product view](https://docs.relewise.com/docs/developer/implementation-steps.html#_2-add-behavioral-tracking) request to Relewise.

```html
<relewise-track-product-view product-id="PRODUCT_ID"></relewise-track-product-view>
```
#### Attributes

- **product-id**:
    
    The id of the product that has been viewed.

- **variant-id** (Optional):
    
    The id of the variant that has been viewed.

### Product category view
This component sends a [track product category view](https://docs.relewise.com/docs/developer/implementation-steps.html#_2-add-behavioral-tracking) request to Relewise.

```html
<relewise-track-product-category-view id-path="ID_PATH"></relewise-track-product-category-view>
```
#### Attributes

- **id-path**:
    
    The id path of the category id.

    The path should be formatted as ids separated by a forward slash ("/").

    E.g.: "parent-category-1/child-category-2/child-category-4"

### Content view
This component sends a [track content view](https://docs.relewise.com/docs/developer/implementation-steps.html#_2-add-behavioral-tracking) request to Relewise.

```html
<relewise-track-content-view content-id="CONTENT_ID"></relewise-track-content-view>
```
#### Attributes

- **content-id**:
    
    The id of the content that has been viewed.

### Content category view
This component sends a [track content category view](https://docs.relewise.com/docs/developer/implementation-steps.html#_2-add-behavioral-tracking) request to Relewise.

```html
<relewise-track-content-category-view id-path="ID_PATH"></relewise-track-content-category-view>
```
#### Attributes

- **id-path**:
    
    The id path of the category id.

    The path should be formatted as ids separated by a forward slash ("/").

    E.g.: "parent-category-1/child-category-2/child-category-4"

### Brand view
This component sends a [track brand view](https://docs.relewise.com/docs/developer/implementation-steps.html#_2-add-behavioral-tracking) request to Relewise.

```html
<relewise-track-brand-view brand-id="BRAND_ID"></relewise-track-brand-view>
```
#### Attributes

- **brand-id**:
    
    The id of the brand that has been viewed.
