# Universal Search UI Components Plan

Last updated: 2026-06-26

## Purpose

Build the universal search experience in `packages/web-components` first. The Shopify web-components extension is the end goal, but it is explicitly a second iteration and should not be implemented until the UI Components work is complete, documented, tested, and stable.

This plan supersedes the earlier POC-driven implementation direction where it conflicts with existing UI Components architecture. The POC remains useful as behavioral research, but its standalone `MerchantConfig`, custom card rendering, custom facet rendering, and custom URL state should not become the final public contract.

## Working Rules

- Follow the root `AGENTS.md`. It already exists and names `packages/web-components` as the primary working directory.
- Preserve existing public behavior for:
  - `relewise-product-search`
  - `relewise-product-search-overlay`
  - `relewise-product-search-results`
  - `relewise-product-search-sorting`
  - `relewise-facets`
- Add universal search as part of the existing search feature surface, not as a separate search ecosystem.
- Keep Shopify out of the first implementation. Shopify should later map app settings into the UI Components API.
- Split implementation into small pull requests. Avoid one large feature PR.
- Prefer extracting reusable logic from existing components before adding universal-search-only logic.
- Product and content cards must reuse the existing tile/template override model wherever possible.

## Branching Strategy

Use a dedicated universal search integration branch as the temporary base for this work. Smaller implementation branches should branch from and merge back into that integration branch. Only merge the integration branch into `main` when the UI Components universal-search implementation is complete, tested, documented, and ready for public consumption.

The integration branch should contain this plan file so every smaller task can reference the same source of truth.

## Implementation Discipline

Avoid overengineering. The universal-search implementation should look and feel like the existing UI Components codebase, not like a new framework inside the package.

Rules:

- Do not add broad normalizer, sanitizer, mapper, or adapter layers unless an existing component already has the same kind of layer or the feature has a concrete repeated need.
- Do not defensively guard every possible malformed response shape. Data returned by Relewise can be treated as already sanitized and structurally valid for the selected request.
- Add checks only where they are part of existing component behavior, protect a real optional feature, avoid a known runtime error, or improve a user-facing state.
- Keep request/result transformation minimal and local. Prefer passing Relewise results directly into existing tiles, facets, and sorting helpers.
- Do not add generic utility abstractions for one caller.
- For search input, follow the existing `relewise-search-bar` and `relewise-product-search-bar` behavior as closely as possible. Minimal user-input cleanup such as trimming leading/trailing whitespace is acceptable only when it is clearly tied to search term handling, URL state, or duplicate request prevention.
- Prefer straightforward Lit component state over custom state managers, controllers, or orchestration classes unless the same pattern already exists in this package.

## Direction

The universal search should be an opt-in search experience registered through `useSearch(...)`.

The recommended shape is:

```ts
initializeRelewiseUI({ ... }).useSearch({
    facets: {
        product(builder) {
            builder
                .addFacet(f => f.addBrandFacet(), { heading: 'Brand' })
                .addFacet(f => f.addSalesPriceRangeFacet('Product'), { heading: 'Price' });
        },
    },
    sorting: sorting => sorting
        .clear()
        .addRelevance()
        .addSalesPriceAscending(),
    universalSearch: {
        tabs: {
            products: {},
            productCategories: {},
            content: {},
        },
    },
});
```

The exact `universalSearch` type should be finalized in the first implementation PR, but the principle is fixed:

- Existing product `facets`, product `sorting`, filters, relevance modifiers, target overrides, selected properties, and templates stay authoritative.
- `universalSearch` adds modal behavior, tab behavior, input-assist behavior, empty/no-result recommendations, layout defaults, and tab enablement.
- Product result rendering delegates to `relewise-product-tile`.
- Content result rendering delegates to `relewise-content-tile`.
- Product/content custom field rendering is handled through existing `templates.product` and `templates.content`.
- Category rendering can use a new reusable category tile because no general category tile exists today.

## Existing Architecture Research

### Initialization And Registration

Relevant files:

- `src/initialize.ts`
- `src/app.ts`
- `src/index.ts`

Current behavior:

- `initializeRelewiseUI(options)` stores `window.relewiseUIOptions`.
- `.useSearch(options)` stores `window.relewiseUISearchOptions`.
- `useSearch` registers all search components and generic shared components through the local `tryRegisterElement` helper.
- Public exports flow through feature barrels and `src/index.ts`.

Reuse decision:

- Extend `RelewiseUISearchOptions` with `universalSearch?: UniversalSearchOptions`.
- Register the new full-page components inside `useSearch`.
- Export new types/components through `src/search/index.ts` and `src/index.ts`.
- Do not add a second initializer.

### Search Request Construction

Relevant files:

- `src/builders/productSearchBuilder.ts`
- `src/builders/productCategorySearchBuilder.ts`
- `src/search/product-search.ts`
- `src/targetedSearchConfigurations.ts`

Current behavior:

- `createProductSearchBuilder(term, settings)` applies selected product/variant properties, exploded variants, term, product relevance modifiers, global product filters, and search product filters.
- `createProductCategorySearchBuilder(term, settings)` applies selected category properties, term, category relevance modifiers, global category filters, and search category filters.
- `ProductSearch` adds pagination, facets, sorting, selected facet values from URL, and target-specific overrides.
- `TargetedSearchConfigurations.handle(...)` currently accepts a `ProductSearchBuilder`, can overwrite product facets/sorting, and can apply filters/relevance modifiers.

Reuse decision:

- Extract product request assembly from `ProductSearch` into reusable helpers before building the universal-search products tab.
- Keep `ProductSearch` behavior unchanged by making it call the extracted helper.
- Full-search products tab must use the same helper, including targeted product search config.
- Reuse `createProductCategorySearchBuilder` for the product categories tab.
- Add a matching content search builder helper because no reusable content search builder exists today.

Needed new helpers:

- Product search request helper:
  - Input: term, settings, page, page size, target, selected URL state.
  - Output: built request plus facet labels.
  - Must preserve current `ProductSearch` behavior.
- Content search builder helper:
  - Uses `ContentSearchBuilder`.
  - Applies `selectedPropertiesSettings.content`, content filters, and content relevance modifiers.
  - Supports content facets only after the shared facet model is generalized.
- Product category search helper:
  - Reuse existing builder.
  - Add optional sorting support if product category sorting is included in first release.

### Search Events

Relevant files:

- `src/helpers/events.ts`
- `src/search/product-search.ts`
- `src/search/components/product-search-bar.ts`
- `src/search/components/product-search-sorting.ts`
- `src/search/components/facets/*`

Current behavior:

- Search is event-driven through window events such as `search`, `applyFacet`, `applySorting`, `loadMoreProducts`, `showLoadingSpinner`, `dimPreviousResult`, and `searchingForProductsCompleted`.
- Existing events are product-search oriented.

Reuse decision:

- Keep existing event names and semantics for existing components.
- Full-search can use internal component state for tab orchestration instead of broadcasting every tab change globally.
- Add new events only when external consumers need them.
- Avoid reusing product-only events for content/category actions if doing so would confuse existing listeners.

Potential new events:

- `relewise-ui-components:universal-search-opened`
- `relewise-ui-components:universal-search-closed`
- `relewise-ui-components:universal-search-completed`

These are not first-pass requirements. Add them only if an actual consumer or testable integration need appears.

### URL State

Relevant files:

- `src/helpers/urlState.ts`
- `src/search/product-search.ts`
- `src/search/components/product-search-bar.ts`
- `src/search/components/product-search-sorting.ts`
- `src/search/components/facets/*`

Current behavior:

- Existing query keys:
  - `rw-term`
  - `rw-take`
  - `rw-sorting`
  - `rw-facet-*`
  - `rw-facet-upperbound-*`
  - `rw-facet-lowerbound-*`
- `ProductSearchBar.setSearchTerm` calls `clearUrlState()`, which removes all query parameters.
- Current helpers are not tab-aware.

Reuse decision:

- Reuse `rw-term` for the search term so universal search aligns with current product search/share URLs.
- Preserve current product search behavior.
- Add scoped URL helpers for universal-search state instead of changing `clearUrlState()` behavior globally.
- Namespaced universal-search keys are allowed where the existing keys would collide.

Proposed universal-search URL keys:

| State | Proposed key | Notes |
| --- | --- | --- |
| Search term | `rw-term` | Reuse existing search term key. |
| Active tab | `rw-universal-search-tab` | Needed for shareable tabs. |
| Product sorting | `rw-sorting` | Reuse existing product sorting key. |
| Product facets | `rw-facet-*` | Reuse existing product facet keys. |
| Product pagination/take | `rw-take` or `rw-products-take` | Prefer existing `rw-take` if behavior matches product search. |
| Content sorting | `rw-content-sorting` | Avoid collision with product sorting. |
| Content facets | `rw-content-facet-*` | Avoid collision with product facets. |
| Content pagination/take | `rw-content-take` | Tab-specific. |
| Product category sorting | `rw-product-categories-sorting` | Only if category sorting ships. |
| Product category pagination/take | `rw-product-categories-take` | Tab-specific. |

Acceptance:

- Searches can be shared/revisited.
- Existing `relewise-product-search` URLs still work.
- Full-search does not accidentally clear unrelated page query parameters unless that is already part of the existing product-search behavior being invoked intentionally.

### Facets

Relevant files:

- `src/facetBuilder.ts`
- `src/search/components/facets/facets.ts`
- `src/search/components/facets/checklist-facet-base.ts`
- `src/search/components/facets/number-range-facet.ts`
- `src/search/types/facet.ts`

Current behavior:

- `RelewiseFacetBuilder` wraps the Relewise client `FacetBuilder` and stores display labels in order.
- `SearchFacets` only exposes `product?: (builder: RelewiseFacetBuilder) => void`.
- `Facets` accepts `ProductFacetResult`.
- `FacetResult` union types already include content and category facet result types, but the renderer switch mainly handles product result names.
- `ChecklistFacetBase` and `NumberRangeFacet` write selected values directly to current product URL keys.

Reuse decision:

- Reuse the existing facet components, but generalize them before universal-search depends on content facets.
- Product facets must still behave exactly as they do now.
- Add content facet support through the same rendering path where result shapes are compatible.
- Avoid separate product/content facet row implementations.

Needed changes:

- Broaden `SearchFacets` to support content where the client API supports it:

```ts
export interface SearchFacets {
    product?: (builder: RelewiseFacetBuilder) => void;
    content?: (builder: RelewiseFacetBuilder) => void;
}
```

- Make `Facets` accept a generic `FacetResult` container, not only `ProductFacetResult`.
- Map content facet result `$type` values to the same reusable checklist/number range components where possible:
  - `ContentDataStringValueFacetResult`
  - `ContentDataBooleanValueFacetResult`
  - `ContentDataDoubleValueFacetResult`
  - `ContentDataDoubleRangeFacetResult`
  - `ContentAssortmentFacetResult`
  - `CategoryHierarchyFacetResult` for content categories if compatible.
- Keep existing facet URL keys in this phase; add scoped universal-search facet URL state later with the universal-search orchestrator if product/content facet keys can collide.
- Keep facet components dispatching the existing `Events.applyFacet` event in this phase.
- Add scoped product/content facet events later only if the universal-search orchestrator needs separate event handling.
- Hide empty facet groups.
- Preserve wrapping/overflow rules so long labels do not overlap.

### Sorting

Relevant files:

- `src/search/searchSortingBuilder.ts`
- `src/search/components/product-search-sorting.ts`
- `src/search/enums/sortingEnum.ts`
- `tests/searchSortingBuilder.test.ts`
- `tests/productSearchSorting.test.ts`

Current behavior:

- `SearchSortingOptionsBuilder` is product-specific.
- Built-in defaults are relevance, price ascending, price descending, alphabetical ascending, alphabetical descending.
- Product data sorting is supported.
- Targeted product sorting overrides are supported.

Reuse decision:

- Product universal-search tab must use the existing product sorting builder and targeted sorting behavior.
- `relewise-product-search-sorting` may be too coupled to global product URL state for direct reuse inside universal-search, but its builder logic should be reused.
- Add content/category sorting only if the API surface and design need it in the first release.

Needed changes:

- Extract a lower-level sorting select renderer or allow `ProductSearchSorting` to accept controlled props.
- Keep existing `ProductSearchSorting` behavior unchanged.
- Consider new builders only where necessary and only when content/category sorting is actively implemented:
  - `ContentSearchSortingOptionsBuilder`
  - `ProductCategorySearchSortingOptionsBuilder`

Do not overload product sorting config for content/category sorting.

### Product And Content Tiles

Relevant files:

- `src/components/product-tile.ts`
- `src/components/content-tile.ts`
- `src/recommendations/products/product-recommendation-base.ts`
- `src/recommendations/content/content-recommendation-base.ts`
- `src/search/components/product-search-results.ts`
- `tests/tileImage.test.ts`

Current behavior:

- Product recommendations and product search results render `relewise-product-tile`.
- Content recommendations render `relewise-content-tile`.
- Tiles support complete override through `initializeRelewiseUI({ templates: { product, content } })`.
- Product tile default rendering uses `product.displayName`, `product.salesPrice`, `product.listPrice`, and data key `Url`.
- Content tile default rendering uses `content.displayName`, data key `Url`, and hardcoded data key `Summary`.

Reuse decision:

- Full-search product results must render `relewise-product-tile`.
- Full-search content results must render `relewise-content-tile`.
- Product/content recommendation blocks inside universal-search should also use the same tiles.
- Do not add a separate product card template API for universal-search unless tile templates cannot cover a real use case.
- Do not add tile field-mapping attributes in the first universal-search iteration. If a consumer needs custom product/content fields, the established solution is `templates.product` and `templates.content`.
- Request helpers should continue to respect existing selected property settings. Consumers using custom templates are responsible for selecting the data keys their templates need, as they are today.

### Category Rendering

Current behavior:

- No general product/category tile exists.
- Compact search overlay has `relewise-product-search-overlay-product-category`, but it is a compact overlay row, not a reusable card.
- POC has custom product/content category cards.

Reuse decision:

- Add a small reusable category tile for universal-search category surfaces.
- The tile should support both product categories and content categories if the result shapes allow it.
- It should support:
  - `image-data-key`
  - `image-base-url`
  - `url-data-key`
  - `display-name-data-key`
- It should expose parts and CSS variables but remain simpler than product/content tiles.

Potential component:

- `relewise-category-tile`

Open decision:

- Whether category templates belong in `initializeRelewiseUI({ templates })`.
- If added, prefer general names such as `productCategory` and `contentCategory`, not universal-search-only names.

### Search Input And Input Assist

Relevant files:

- `src/search/components/search-bar.ts`
- `src/search/components/product-search-bar.ts`
- `src/search/product-search-overlay.ts`
- POC `development/search/universal-search-poc/index.ts`

Current behavior:

- `relewise-search-bar` is a reusable input component.
- `ProductSearchBar` wraps it for product search URL state and search events.
- `ProductSearchOverlay` already uses `SearchTermPredictionBuilder`, but only for product entity type.

Reuse decision:

- Full-search should use `relewise-search-bar` directly, not `ProductSearchBar`, because universal-search has modal state, input-assist state, tabs, and scoped URL updates.
- Reuse the compact overlay's search term prediction idea, but not its compact overlay result renderer.

Required behavior:

- Popular search terms appear when the input is focused and empty.
- Search term predictions appear when the input is focused and typed.
- Hide popular terms when the request returns no terms.
- Hide predictions on Enter, suggestion click, outside click, or input blur.
- Do not show predictions that exactly match the current input term.
- Search Term Predictions and PopularSearchTerms remain separate features.

### Recommendations And Empty States

Relevant files:

- `src/recommendations/*`
- `src/recommendations/recommender.ts`
- POC `development/search/universal-search-poc/index.ts`

Current behavior:

- Product/content recommendation components exist and render tiles.
- There are no reusable components for every recommendation block needed by universal-search:
  - popular product categories
  - popular content categories
  - popular search terms
  - search-term-based products inside no-result panels

Reuse decision:

- Full-search can call `Recommender` directly through new helper functions for initial/no-result blocks.
- Use product/content tiles for product/content recommendation rendering.
- Use the new category tile for category recommendation rendering.
- Do not force every recommendation block to be a standalone Web Component before universal-search can ship.

Recommendation block types from the POC that are reasonable for first release:

- `PopularProducts`
- `RecentlyViewedProducts`
- `PopularProductCategories`
- `PopularContents`
- `PopularContentCategories`
- `PopularSearchTerms`
- `SearchTermBasedProduct`

Behavior rules:

- Initial view is shown when no term has been entered.
- Tabs are not shown in the termless initial view.
- When a term is entered, run searches for enabled tabs.
- From initial state, activate the first tab with results.
- Once the user is already on a tab, do not auto-switch tabs because filters made that tab zero-hit.
- If every enabled tab is zero-hit:
  - Respect zero-hit tab visibility config.
  - If zero-hit tabs are hidden, show global no-result recovery blocks.
  - If zero-hit tabs remain visible, show tab-specific no-result recovery blocks.

### Compact Product Search Overlay

Relevant files:

- `src/search/product-search-overlay.ts`
- `src/search/components/product-search-overlay-results.ts`
- `src/search/components/product-search-overlay-product.ts`
- `src/search/components/product-search-overlay-product-category.ts`

Current behavior:

- Compact overlay is product-oriented.
- It batches product search, search term predictions, and product category search.
- It uses overlay-specific templates:
  - `searchOverlayProductResult`
  - `searchOverlayProductCategoryResult`
- It does not use `relewise-product-tile`.

Reuse decision:

- Do not refactor the compact overlay as part of the first universal-search PRs.
- Do not break its templates.
- A later compatibility option may let a trigger choose compact overlay or full-page overlay, but the first UI Components work should keep compact overlay stable.

### Shopify Extension Findings

Relevant files outside this repo:

- `C:\code\relewise-apps-shopify\extensions\web-components\assets\initialize.js`
- `C:\code\relewise-apps-shopify\extensions\web-components\assets\search-config-facets.js`
- `C:\code\relewise-apps-shopify\extensions\web-components\blocks\product-search.liquid`
- `C:\code\relewise-apps-shopify\extensions\web-components\assets\search-overlay.js`

Findings:

- Shopify already initializes UI Components through `initializeRelewiseUI(...).useSearch(...)`.
- Shopify already maps app search settings into `RelewiseFacetBuilder`.
- Shopify already maps app sorting settings into `SearchSortingOptionsBuilder`.
- Shopify already uses `templates.product` and `templates.content` for complete product/content rendering overrides.
- Shopify compact overlay currently replaces Shopify search forms with `relewise-product-search-overlay`.

Implication:

- The UI Components universal-search API must preserve the existing facet/sorting/template model so Shopify can later map app settings into it.
- Shopify work should become a mapping/integration layer, not a forked implementation.

## Proposed Public API Areas

### `RelewiseUISearchOptions`

Add:

```ts
export interface RelewiseUISearchOptions {
    // existing options remain
    universalSearch?: UniversalSearchOptions;
}
```

### `UniversalSearchOptions`

Proposed starting shape:

```ts
export interface UniversalSearchOptions {
    tabs?: UniversalSearchTabsOptions;
    behavior?: UniversalSearchBehaviorOptions;
    inputAssist?: UniversalSearchInputAssistOptions;
    recommendations?: UniversalSearchRecommendationOptions;
}
```

Providing `universalSearch` opts in to registering and using the universal-search component. There is no top-level `enabled` flag; consumers remove or omit `universalSearch` to opt out.

Keep styling primarily in CSS variables and parts, not JavaScript configuration.

### Tabs

```ts
export interface UniversalSearchTabsOptions {
    products?: UniversalSearchTabOptions;
    productCategories?: UniversalSearchTabOptions;
    content?: UniversalSearchTabOptions;
}

export interface UniversalSearchTabOptions {
    pageSize?: number;
}
```

Notes:

- Providing a tab option enables that tab. Omit a tab to disable it.
- Product tab uses existing `facets.product` and existing `sorting`.
- Content facets can use `facets.content` once added.
- Content/category sorting needs separate config if included.

### Behavior

```ts
export interface UniversalSearchBehaviorOptions {
    minimumCharactersToSearch?: number;
    showModalBeforeInput?: boolean;
    zeroResultTabs?: 'show' | 'hide';
    activateFirstTabWithResultsFromInitialState?: boolean;
}
```

Defaults:

- `minimumCharactersToSearch`: `0`
- `showModalBeforeInput`: `true`
- `zeroResultTabs`: `show`
- `activateFirstTabWithResultsFromInitialState`: `true`

Rules:

- Do not show result tabs in the termless initial state.
- Auto-activate first result tab only when transitioning out of the initial state.
- Do not auto-switch tabs after the user has intentionally selected a tab.

### Input Assist

```ts
export interface UniversalSearchInputAssistOptions {
    popularSearchTerms?: {
        take?: number;
    };
    searchTermPredictions?: {
        take?: number;
        entityTypes?: Array<'Product' | 'ProductCategory' | 'Content'>;
    };
}
```

Defaults:

- Providing an input-assist option enables that section. Omit a section to disable it.
- Prediction entity types default to Product, ProductCategory, Content when search term predictions are configured.

### Recommendations

```ts
export interface UniversalSearchRecommendationOptions {
    initial?: UniversalSearchRecommendationBlock[];
    noResults?: {
        global?: UniversalSearchRecommendationBlock[];
        products?: UniversalSearchRecommendationBlock[];
        productCategories?: UniversalSearchRecommendationBlock[];
        content?: UniversalSearchRecommendationBlock[];
    };
}
```

Recommendation block:

```ts
export interface UniversalSearchRecommendationBlock {
    id?: string;
    title?: string;
    type:
        | 'PopularProducts'
        | 'RecentlyViewedProducts'
        | 'PopularProductCategories'
        | 'PopularContents'
        | 'PopularContentCategories'
        | 'PopularSearchTerms'
        | 'SearchTermBasedProduct';
    take?: number;
}
```

Providing a recommendation block enables it. Omit the block to disable it.

## Component Model

### New Components

Recommended components:

- `relewise-universal-search`
  - Owns modal state, term state, active tab, batched requests, URL sync, input assist, empty states, no-result states, and mobile drawer state.
- `relewise-universal-search-tabs`
  - Renders enabled tabs, active tab, counts, disabled/zero-hit state.
- `relewise-universal-search-facet-panel`
  - Shell for active-tab facets.
- `relewise-universal-search-facet-drawer`
  - Mobile facet sheet/drawer.
- `relewise-category-tile`
  - Renders product/content category cards.

Avoid adding components that simply duplicate current tiles/facets/sorting with different names.

### Reused Components

| Existing piece | Reuse | Notes |
| --- | --- | --- |
| `relewise-search-bar` | Direct reuse | Full-search controls URL/state itself. |
| `relewise-product-tile` | Direct reuse | Custom product rendering uses existing `templates.product`. |
| `relewise-content-tile` | Direct reuse | Custom content rendering uses existing `templates.content`. |
| `relewise-facets` | Reuse after generalization | Must support content-compatible facet result shapes; scoped URL state belongs with the universal-search orchestrator if needed. |
| Facet item components | Reuse after generalization | Avoid duplicate product/content filter markup. |
| `SearchSortingOptionsBuilder` | Reuse for product tab | Do not duplicate product sorting config. |
| `relewise-product-search-sorting` | Reuse logic, maybe not component | Component is currently coupled to product URL state. |
| `relewise-button` | Direct reuse | Existing button pattern. |
| Icons | Direct reuse | Use existing icon components. |
| `relewise-loading-spinner` | Direct reuse | Loading states. |
| `getSearcher` / `getRecommender` | Direct reuse | Same client construction. |
| `getRelewiseContextSettings` | Direct reuse | Same displayed-at-location/user/language/currency flow. |

## Phased Pull Request Plan

### PR 0: Plan And Alignment

Scope:

- Add this plan file.
- No runtime changes.

Validation:

- No build required for docs-only change.

### PR 1: Shared Product Search Foundations

Goal:

Extract reusable product search request/state helpers without changing behavior.

Tasks:

- Extract product request assembly currently inside `ProductSearch.search(...)`.
- Extract selected facet value application from URL state.
- Keep `ProductSearch` using the extracted helper.
- Add unit tests that prove current product search request behavior is unchanged.
- Add tests for targeted facets/sorting still applying to product search.

Acceptance:

- Existing `ProductSearch` behavior unchanged.
- Existing sorting tests still pass.
- No universal-search UI yet.

### PR 2: Facet Generalization

Goal:

Make facet rendering reusable for universal-search product and content tabs.

Tasks:

- Broaden facet component types from product-only to compatible generic facet result types.
- Add content data string/boolean/double facet rendering.
- Add content assortment facet rendering if compatible.
- Add content category hierarchy rendering if supported cleanly.
- Hide empty groups.
- Add tests for long labels/no overlap at component markup level where possible.

Acceptance:

- Existing product facets still work.
- Content facet results can render through the same facet panel path.
- No duplicate product/content facet row implementation.

### PR 3: Universal Search API And Skeleton

Goal:

Introduce the public universal-search option and base modal without completing every tab.

Tasks:

- Add `universalSearch?: UniversalSearchOptions` to `RelewiseUISearchOptions`.
- Register `relewise-universal-search` through `useSearch`.
- Add base modal:
  - open/close
  - reflected `open` attribute with `open()` / `close()` methods
  - search input
  - keyboard close
  - ARIA dialog semantics
  - CSS parts and variables
- Add URL term read/write using `rw-term`.
- Add initial termless view placeholder.
- Do not auto-open from `rw-term` in this phase; prefill only.
- Do not add tab placeholders in this phase.

Acceptance:

- Component registers idempotently.
- Modal can open/close.
- No product/content/category network work yet, or only mocked/dev-safe network work.

### PR 4: Products Tab

Goal:

Ship universal-search product tab using existing product search configuration.

Tasks:

- Add products tab with batched/universal-search request orchestration.
- Use shared product search request helper.
- Use existing `facets.product`.
- Use existing product sorting builder and target overrides.
- Render `relewise-product-tile`.
- Support pagination/load more.
- Support zero-result product tab state.

Acceptance:

- Product facets/sorting match current product search config.
- Shopify-style target config can be applied through a `target` attribute or equivalent.
- Product cards are fully overridable through `templates.product`.

### PR 5: Product Categories And Content Tabs

Goal:

Add the non-product result tabs while staying consistent with existing patterns.

Tasks:

- Add product categories tab using `createProductCategorySearchBuilder`.
- Add `relewise-category-tile`.
- Add content search builder helper.
- Add content tab using `ContentSearchBuilder`.
- Render content with `relewise-content-tile`.
- Add optional content facets through generalized facet path.
- Add content/category pagination.
- Add content/category no-result states.

Acceptance:

- Disabled tabs do not request.
- Enabled tab requests can run in a batch.
- Content cards are fully overridable through `templates.content`.
- Category cards have a documented default rendering and extension path.

### PR 6: Input Assist

Goal:

Add focused-empty popular terms and typed-query predictions.

Tasks:

- Add PopularSearchTerms request helper.
- Add SearchTermPrediction request helper.
- Render assist panel below search input.
- Hide assist when no data is returned.
- Hide predictions/popular terms on Enter, suggestion click, outside click, or blur.
- Filter predictions equal to the current input term.
- Add keyboard navigation if included in first release.

Acceptance:

- PopularSearchTerms only appears on focused empty input.
- SearchTermPredictions only appears on focused typed input.
- Suggestions do not persist after selection/search.

### PR 7: Initial And No-Result Recommendation Blocks

Goal:

Add configurable discovery and recovery blocks.

Tasks:

- Add recommendation block config.
- Add request helpers for supported block types.
- Render products with product tiles.
- Render content with content tiles.
- Render categories with category tile.
- Respect anonymous user behavior for RecentlyViewedProducts.
- Add initial state behavior.
- Add global no-result and tab-specific no-result behavior.

Acceptance:

- Termless state shows initial blocks and no tabs.
- Zero-result behavior follows config.
- Tab auto-switch happens only from initial state.

### PR 8: Responsive Layout And Styling

Goal:

Apply the final default layout and theming hooks.

Tasks:

- Apply Lovable-derived default layout.
- Add desktop and mobile CSS variables for:
  - overlay width/height
  - search width
  - tabs width
  - layout width
  - facet rail/drawer width
  - result column width
  - product/content/category card columns
- Add stable `part` attributes.
- Validate no mobile overflow/overlap.
- Disable or hide sorting when active tab has no sortable results. Prefer disabled if it preserves layout clarity.

Acceptance:

- Desktop and mobile layouts are usable.
- Long facet labels do not overlap.
- Cards do not overflow.
- Search input, tabs, facets, and result layout are configurable by CSS variables.

### PR 9: Documentation

Goal:

Make the feature consumable.

Tasks:

- Update `packages/web-components/README.md`.
- Add usage examples.
- Add custom template examples.
- Add universal-search config examples.
- Add migration guidance from compact overlay.

Acceptance:

- Every public option is documented.

## Future Shopify Iteration

Do not start this until UI Components work is complete.

Future Shopify tasks:

1. Update the Shopify extension bundle version to include universal-search UI Components.
2. Add a Shopify search experience setting:
   - disabled
   - current compact overlay
   - universal search
3. Add a new storefront integration path instead of modifying current compact overlay behavior in place.
4. Reuse existing Shopify init context:
   - credentials
   - language
   - currency
   - user
   - selected properties
   - Shopify-domain filters
   - product/content templates
5. Map existing Shopify facet configuration into `facets.product`.
6. Map existing Shopify sorting configuration into product `sorting`.
7. Add new Shopify settings only for things that do not already exist:
   - enabled tabs
   - initial/recovery blocks
   - input assist
   - universal search toggle
8. Keep current compact overlay available.

## Non-Goals For UI Components First Iteration

- Do not change Shopify extension code.
- Do not remove or deprecate the compact product search overlay.
- Do not replace existing product search configuration.
- Do not introduce a parallel product facet/sorting/card configuration model.
- Do not make universal-search depend on Shopify-specific data keys.
- Do not commit built `dist` or `build` artifacts unless explicitly requested.

## Implementation Risks

| Risk | Mitigation |
| --- | --- |
| Full-search duplicates product search logic | Extract helpers from `ProductSearch` before adding universal-search product tab. |
| Product cards are not fully overridable | Render `relewise-product-tile` and preserve `templates.product`. |
| Content cards are not fully overridable | Render `relewise-content-tile` and preserve `templates.content`. |
| Content facets diverge from product facets | Generalize existing facet components first. |
| URL state becomes incompatible | Reuse `rw-term` and product keys where safe; namespace only tab-specific state. |
| PR becomes too large | Follow the PR phases above and keep behavior-preserving refactors separate from feature work. |
| Shopify needs a different API | Keep universal-search under `useSearch` and reuse existing facet/sorting/template contracts. |

## Validation Strategy

For runtime PRs, run from `packages/web-components`:

```bash
npm run build
npm run build:types
npm run test
```

Test coverage by phase:

- Request helper tests for product/category/content builders.
- URL state tests for scoped universal-search keys.
- Facet rendering tests for product and content facet result types.
- Sorting builder/control tests.
- Component registration tests.
- Full-search state tests:
  - termless initial view
  - tabs hidden without term
  - active tab from URL
  - first-result tab activation from initial state only
  - zero-result tab behavior
  - disabled tabs do not request
  - input assist focus/dismiss behavior

## Trello Breakdown Candidates

- Research and plan alignment.
- Extract shared product search request helper.
- Add universal-search scoped URL helper.
- Add category tile.
- Generalize facet renderer for content-compatible facets.
- Add universal-search option types and component registration.
- Build universal-search base modal.
- Build products tab.
- Build product categories tab.
- Build content tab.
- Add input assist.
- Add recommendation blocks.
- Add responsive styling and CSS variables.
- Add README documentation.
- Shopify integration planning after UI Components completion.
