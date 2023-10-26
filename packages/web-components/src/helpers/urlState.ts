export const searhTermQueryName = 'relewiseSearchTerm';
export const numberOfProductSearchResults = 'relewiseProducts';
export const productSearchSorting = 'relewiseProductSearchSorting';

export function updateUrlState(queryParamName: string, value: string) {
    const currentUrl = new URL(window.location.href);
    
    if (!value) {
        currentUrl.searchParams.delete(queryParamName);
        window.history.replaceState({}, document.title, currentUrl);
        return;
    }
    
    currentUrl.searchParams.set(queryParamName, value);
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

export function getNumberOfProductSearchResults(): number | null {
    const productSearchResultsToLoad = readCurrentUrlState(numberOfProductSearchResults);

    if (!productSearchResultsToLoad) {
        return null;
    }

    const parsedValue = parseInt(productSearchResultsToLoad, 10);

    if (isNaN(parsedValue)) {
        return null;
    } 

    return parsedValue;
}