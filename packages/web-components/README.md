# Relewise UI Component [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE) [![npm version](https://img.shields.io/npm/v/@relewise%2Fweb-components.svg)](https://badge.fury.io/js/@relewise%2Fweb-components) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Relewise/relewise-ui-components/pulls)

## Installation 

Install via NPM or you preferred package manager: 

```W
npm install @relewise/web-components
```

## Initialising
In order to use the web component, we need to configure RelewiseUI.
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

Replace the `RELEWISE_DATASET_ID`, `RELEWISE_API_KEY`, `RELEWISE_SERVER_URL` with your dataset, api key and server url found at [My.Relewise](https://my.relewise.com/developer-settings). 

After which you have access to various components configured with the configuration provided.

## Configuring Relewise Client
You are required to configure the client that you use to call Relewise. Provide the following configuration during initialization.

The main purpose of the client options is to configure which relewise server to call. These are almost always different between development and production environments.
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

Some components can be set with attributes that specify the behaviour of the specific component.

To render a specific component you simply use the corresponding html tag.

E.g. the `relewise-purchased-with-product` takes in an attribute `product-id` specifying which product the recommendations should be based on. 
```html
<relewise-purchased-with-product product-id="PRODUCT_ID"></relewise-purchased-with-product>
```
Replace the `PRODUCT_ID` with your own product's id.

### Popular Products
This component renders the most [popular products](https://docs.relewise.com/docs/recommendations/recommendation-types.html#popular-products).

```html
<relewise-popular-products displayed-at-location="LOCATION"></relewise-popular-products>
```
#### Attributes
- **displayed-at-location** : 
    
    Where the recommendations are being shown. 
    
    For more information see our [docs](https://docs.relewise.com/docs/developer/bestpractice.html#_4-recommendation-requests).
    
- **number-of-recommendations** (Optional, *Default 4*): 
    
    The amount of products to render.

- **since-minutes-ago** (Optional, *Default 20160 - 14 days*):
    
    The time interval, in minutes, that the popularity calculation should be based on.

- **based-on** (Optional, *Default MostPurchased*):

    possible values: MostPurchased, MostViewed 

    The type of behavioural data that recommendations should be based on.

### Products viewed after viewing Product
This component renders [products typically viewed after viewing a given product](https://docs.relewise.com/docs/recommendations/recommendation-types.html#products-viewed-after-viewing-product).

```html
<relewise-products-viewed-after-viewing-product product-id="PRODUCT_ID" displayed-at-location="LOCATION"></relewise-products-viewed-after-viewing-product>
```
#### Attributes
- **displayed-at-Location** : 
    
    Where the recommendations are being shown. 
    
    For more information, see our [docs](https://docs.relewise.com/docs/developer/bestpractice.html#_4-recommendation-requests).

- **product-id**:
    
    The id of the product the recommendations should be based on.

- **variant-id** (Optional):
    
    The id of the product variant the recommendations should be based on.

- **number-of-recommendations** (Optional, *Default 4*): 

    The amount of products to render.

### Products purchased with Product
This component renders [products typically purchased with a given product](https://docs.relewise.com/docs/recommendations/recommendation-types.html#purchased-with-product).

```html
<relewise-purchased-with-product product-id="PRODUCT_ID" displayed-at-Location="LOCATION"></relewise-purchased-with-product>
```
#### Attributes
- **displayed-at-Location** : 
    
    Where the recommendations are being shown. 
    
    For more information see our [docs](https://docs.relewise.com/docs/developer/bestpractice.html#_4-recommendation-requests).

- **product-id**:
    
    The id of the product the recommendations should be based on.

- **variant-id** (Optional):
    
    The id of the product variant the recommendations should be based on.

- **number-of-recommendations** (Optional, *Default 4*): 

    The amount of products to render.

## Overwriting styling
If you want to overwrite the styling of the grid and the default product tile, you can do so by using css variables.

```html
    <style>
        :root {
            --relewise-font: Arial, Helvetica, sans-serif;

            --relewise-image-align: start;

            --relewise-information-container-margin: 0.5rem 0.5rem 0.5rem 0.5rem;

            --relewise-image-width: 100%;
            --relewise-image-height: auto;

            --relewise-price-font-weight: 600;
            --relewise-price-font-size: 1rem;
            --relewise-price-color: #212427;
            --relewise-price-alignment: start;
            --relewise-price-margin: 0.5rem 0rem 0rem 0rem;

            --relewise-display-name-letter-spacing: -0.025rem;
            --relewise-display-name-alignment: start;
            --relewise-display-name-color: #212427;
            --relewise-display-name-line-height: 1.25rem;
            --relewise-display-name-font-weight: 600;
            --relewise-display-name-font-size: 0.75rem;
            --relewise-display-name-margin: 0rem 0rem 0rem 0rem;

            --relewise-list-price-font-size: .5rem;
            --relewise-list-price-text-decoration: line-through;
            --relewise-list-price-color: darkgray;
            --relewise-list-price-margin: .25rem;
        }
    </style>
```

## Properties to render
By default our web components will render some basic information about the product.

Set the selectedPropertiesSettings in the initialise function to specify which properties to render.

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
If you need to filter what enteties are being shown, you need to initialise the RelewiseUI with the correct filter options.

Here is an example of a filter on products.
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
The builder is a type exposed from the [relewise-sdk-javescript](https://github.com/Relewise/relewise-sdk-javascript).

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
Styling the provided template can be done inline, or by including a style tag containg the preferred styles.
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