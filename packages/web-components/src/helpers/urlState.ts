export enum QueryKeys {
    term = 'rw-term',
    take = 'rw-take',
    productTake = 'rw-product-take',
    productCategoryTake = 'rw-product-category-take',
    contentTake = 'rw-content-take',
    sortBy = 'rw-sorting',
    productSorting = 'rw-product-sorting',
    facet = 'rw-facet-',
    facetUpperbound = 'rw-facet-upperbound-',
    facetLowerbound = 'rw-facet-lowerbound-',
    productFacet = 'rw-product-facet-',
    productFacetUpperbound = 'rw-product-facet-upperbound-',
    productFacetLowerbound = 'rw-product-facet-lowerbound-',
    productCategoryFacet = 'rw-product-category-facet-',
    productCategoryFacetUpperbound = 'rw-product-category-facet-upperbound-',
    productCategoryFacetLowerbound = 'rw-product-category-facet-lowerbound-',
    contentFacet = 'rw-content-facet-',
    contentFacetUpperbound = 'rw-content-facet-upperbound-',
    contentFacetLowerbound = 'rw-content-facet-lowerbound-',
}

export function updateUrlState(queryParamName: string, value: string | null) {
    const currentUrl = new URL(window.location.href);
    
    if (!value) {
        currentUrl.searchParams.delete(queryParamName);
        window.history.replaceState({}, document.title, currentUrl);
        return;
    }
    
    currentUrl.searchParams.set(queryParamName, value);
    window.history.replaceState({}, document.title, currentUrl);
}

export function clearUrlState() {
    const currentUrl = new URL(window.location.href);
    if (!currentUrl.search) {
        return;
    }
    currentUrl.search = '';
    window.history.replaceState({}, document.title, currentUrl);
}

export function clearUrlStateByPrefixes(queryParamNamePrefixes: string[]) {
    const currentUrl = new URL(window.location.href);
    const queryParamNames = [...new Set(Array.from(currentUrl.searchParams.keys()))];

    queryParamNames
        .filter(queryParamName => queryParamNamePrefixes.some(prefix => queryParamName.startsWith(prefix)))
        .forEach(queryParamName => currentUrl.searchParams.delete(queryParamName));

    window.history.replaceState({}, document.title, currentUrl);
}

export function updateUrlStateValues(queryParamName: string, values: string[]) {
    const currentUrl = new URL(window.location.href);
    
    currentUrl.searchParams.delete(queryParamName);
    values.forEach(value => {
        currentUrl.searchParams.append(queryParamName, value);
    });
    
    window.history.replaceState({}, document.title, currentUrl);
}

export function readCurrentUrlState(queryParamName: string): string | null {
    const currentUrl = new URL(window.location.href);

    return currentUrl.searchParams.get(queryParamName);
}

export function readCurrentUrlStateValues(queryParamName: string): string[] {
    const currentUrl = new URL(window.location.href);

    return currentUrl.searchParams.getAll(queryParamName);
}

export function getNumberOfProductsToFetch(): number | null {
    const productSearchResultsToLoad = readCurrentUrlState(QueryKeys.take);

    if (!productSearchResultsToLoad) {
        return null;
    }

    const parsedValue = parseInt(productSearchResultsToLoad, 10);

    if (isNaN(parsedValue)) {
        return null;
    } 

    return parsedValue;
}
