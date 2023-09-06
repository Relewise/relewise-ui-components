# Relewise UI Component [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE) [![npm version](https://badge.fury.io/js/@relewise%2Fclient.svg)](https://badge.fury.io/js/@relewise%2Fweb-components) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Relewise/relewise-ui-components/pulls)

## Installation 

Install via NPM or you preferred package manager: 

```W
npm install @relewise/web-components
```

## Usage examples

### Initialising
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
            displayedAtLocation: 'Product page',
        },
        datasetId: RELEWISE_DATASET_ID,
        apiKey: RELEWISE_API_KEY
    });
```

Replace the `RELEWISE_DATASET_ID`, `RELEWISE_API_KEY` and context settings with your dataset, api key and settings found at [My.Relewise](https://my.relewise.com/developer-settings). 

After which you have access to various components configured with the configuration provided.

### Rendering components
To render a specific component you simply use the corresponding html tag.
```html
<relewise-popular-products></relewise-popular-products>
```

Some components can be set with attributes that specify the behaviour of a specific components.

e.g. the `relewise-purchased-with-product` takes in an attribute `productId` specifying which product the recommendations should be based on. 
```html
<relewise-purchased-with-product productId="PRODUCT_ID"></relewise-purchased-with-product>
```
Replace the `PRODUCT_ID` with your product's id.

### Properties to render
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

### Filtering
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
                    .addBrandIdFilter(['brand1', 'brand2']);
            },
        },
    });
```
The builder is a type exposed from the [relewise-sdk-javescript](https://github.com/Relewise/relewise-sdk-javascript).

For more examples and information about filters visit the official [docs](https://docs.relewise.com/).

### Template overwriting
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
To style the provided template one could do that inline or include a style tag containg the preferred styles.
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

### Configuring Relewise Client
To configure the client used to call Relewise, provide the configuration during initialisation.

The main purpose of the client options is to configure which relewise server to call. These are almost always different between development and production environments
```ts
initializeRelewiseUI(
    {
        ...
        clientOptions: {
            serverUrl: 'https://sandbox-api.relewise.com/',
        },
    });
```