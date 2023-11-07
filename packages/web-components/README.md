# Relewise UI Component [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE) [![npm version](https://img.shields.io/npm/v/@relewise%2Fweb-components.svg)](https://badge.fury.io/js/@relewise%2Fweb-components) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Relewise/relewise-ui-components/pulls)

## Installation 

Install via NPM or you preferred package manager: 

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
        },
        sortingButton: {
            sorting: 'sorting'
            alphabeticalAscending: 'a - z',
            alphabeticalDescending: 'z - a',
            popularity: 'popularity',
            salesPriceAscending: 'low - high',
            salesPriceDescending: 'high - low',
        },
    },
});
```

#### Product Search Overlay
This component renders a search bar that will [search for products](https://docs.relewise.com/docs/intro/search.html#product-search) in Relewise and show results in an overlay.

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

- **debounce-time** (Optional, *Default 250*): 

    The amount of time, in milliseconds, that must pass between requests to Relewise with a new search call.

#### Product Search
This component renders a search bar that [searches for products](https://docs.relewise.com/docs/intro/search.html#product-search) in Relewise and shows results, faceting and sorting options.

```html
<relewise-product-search displayed-at-location="LOCATION"></relewise-product-search>
```

##### Attributes

- **displayed-at-location** : 
    
    Where the search component is being shown. 
    
    For more information see our [docs](https://docs.relewise.com/docs/developer/bestpractice.html#_6-making-search-requests).

- **search-result-page-size** (Optional, *Default 16*): 

    The number of products to search for initially.

- **debounce-time** (Optional, *Default 250*): 

    The amount of time, in milliseconds, that must pass between requests to Relewise with a new search call.

#### Scroll position
When the user navigates to another page or leaves the site, the component will by default not remember where the user last scrolled to.

This can be toggled to do so, to ensure a smooth transition when the user returns back to the site.

This setting is part of the configuration supplied to the `useSearch` function.

```ts
useSearch({
    rememberScrollPosition: true
});
```

#### Facets
By default the component will not render any facets.

To start doing so, include your facet configuration in the `useSearch` function.

The label will be displayed at the top of the facet card.

```ts
useSearch({
    facetBuilder(builder) {
        builder
            .addFacet('Brand label', (facetBuilder) => facetBuilder.addBrandFacet())
            .addFacet('Category label', (facetBuilder) => facetBuilder.addCategoryFacet('ImmediateParent'));
    },
});
```

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

On smaller screens, this component will also include a button to toggle the visability of the facet cards.

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

## Overwriting styling
If you want to overwrite the styling of the grid and the default product tile, you can do so by using css variables.

```html
    <style>
        :root {
            --relewise-font: Arial, Helvetica, sans-serif;
            --relewise-color: lightgray;
            --relewise-accent-color: #3764e4;
            --relewise-border: 2px solid;
            --relewise-border-radius: 1rem;
            
            --relewise-image-align: start;

            --relewise-information-container-margin: 0.5rem 0.5rem 0.5rem 0.5rem;

            --relewise-image-width: 100%;
            --relewise-image-height: auto;
            
            --relewise-hover-color: whitesmoke;

            --relewise-button-height: 3.25rem;
            --relewise-button-text-color: white;
            --relewise-button-text-font-weight: 100;
            --relewise-button-icon-padding: .5rem;

            --relewise-icon-width: 1rem;
            --relewise-icon-height: 1rem;

            --relewise-sales-price-font-weight: 600;
            --relewise-sales-price-font-size: 1rem;
            --relewise-sales-price-color: #212427;
            --relewise-sales-price-alignment: start;
            --relewise-sales-price-margin: 0.5rem 0rem 0rem 0rem;

            --relewise-list-price-font-size: .5rem;
            --relewise-list-price-text-decoration: line-through;
            --relewise-list-price-color: darkgray;
            --relewise-list-price-margin: .25rem;

            --relewise-display-name-letter-spacing: -0.025rem;
            --relewise-display-name-alignment: start;
            --relewise-display-name-color: #212427;
            --relewise-display-name-line-height: 1.25rem;
            --relewise-display-name-font-weight: 600;
            --relewise-display-name-font-size: 0.75rem;
            --relewise-display-name-margin: 0rem 0rem 0rem 0rem;

            --relewise-product-search-overlay-search-bar-height: 3rem;
            --relewise-product-search-overlay-background-color: white;
            --relewise-product-search-overlay-box-shadow: 0 10px 15px rgb(0 0 0 / 0.2);
            --relewise-product-search-overlay-no-results-message-font-weight: 600;
            --relewise-product-search-overlay-no-results-message-color: #212427;
            --relewise-product-search-overlay-prediction-item-font-weight: 600;
            --relewise-product-search-result-overlay-prediction-item-color: #212427;
            --relewise-product-search-result-overlay-product-image-height: 5rem;
            --relewise-product-search-result-overlay-product-image-width: 5rem;
            --relewise-product-search-result-overlay-product-diplay-name-overflow: hidden;
            --relewise-product-search-result-overlay-product-diplay-name-text-overflow: ellipsis;
            --relewise-product-search-result-overlay-product-diplay-name-color: #212427;
            --relewise-product-search-result-overlay-product-sales-price-font-weight: 700;
            --relewise-product-search-result-overlay-product-sales-price-font-size: 1.25rem;
            --relewise-product-search-result-overlay-product-sales-price-color: #212427;
            --relewise-product-search-result-overlay-product-list-price-font-size: 1rem;
            --relewise-product-search-result-overlay-product-list-price-text-decoration: line-through;
            --relewise-product-search-result-overlay-product-list-price-text-color: darkgray;

            --relewise-product-search-sorting-font-size: 1rem;
            --relewise-product-search-sorting-font-weight: 400;
            --relewise-product-search-sorting-border-color: #eee;
            --relewise-product-search-sorting-background-color: #eee;
            --relewise-product-search-sorting-padding: .5rem;

            --relewise-load-more-text-size: 1rem;
            --relewise-load-more-text-color: black;

            --relewise-products-shown-color: gray;
            --relewise-products-shown-font-size: .75rem;

            --relewise-product-search-bar-margin-top: 1rem;
            --relewise-product-search-bar-margin-bottom: 1rem;
            --relewise-product-search-bar-width: 100%;
            --relewise-product-search-margin-right: .5rem;

            --relewise-sorting-options-postion: absolute;
            --relewise-sorting-options-z-index: 10;
            --relewise-sorting-options-background-color: white;
            --relewise-sorting-options-margin-top: .25rem;

            --relewise-checklist-facet-border-radius: 1rem;
            --relewise-checklist-facet-border-color: lightgray;
            --relewise-checklist-facet-background-color: lightgray;
            --relewise-checklist-facet-show-more-text-color: black;
            --relewise-checklist-facet-hits-color: gray;
            --relewise-checklist-facet-hits-font-size: .75rem;

            --relewise-number-range-input-border: 2px solid;
            --relewise-number-range-input-border-radius: 1rem;
            --relewise-number-range-input-height: 2rem;  
            --relewise-number-range-input-width: 4rem;
            --relewise-number-range-save-text-color: black;
        }
    </style>
```

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

## Template overwriting
It is possible to overwrite the template used for rendering products. This is done using [lit templating](https://lit.dev/docs/templates/overview/).

If no custom template is provided, we will render using the default template.
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
The product to render is exposed and contains all the data configured when initialising RelewiseUI.

```ts
initializeRelewiseUI(
    {
        ...
        templates: {
            product: (product, { html, helpers }) => {
                return html`<p>${product.displayName}</p>`;
            }
        }
    });
```
Styling the provided template can be done inline, or by including a style tag containing the preferred styles.
```ts
initializeRelewiseUI(
    {
        ...
        templates: {
            product: (product, { html, helpers }) => {
                return html`
                    <styles><!-- Write your styled here --></styles>
                    <!-- Write your template here -->`;
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

    The path should be formatted as ids sepparated by a forward slash ("/").

    E.g.: "parent-category-1/child-category-2/child-category-4"

### Brand view
This component sends a [track brand view](https://docs.relewise.com/docs/developer/implementation-steps.html#_2-add-behavioral-tracking) request to Relewise.

```html
<relewise-track-brand-view brand-id="BRAND_ID"></relewise-track-brand-view>
```
#### Attributes

- **brand-id**:
    
    The id of the brand that has been viewed.
