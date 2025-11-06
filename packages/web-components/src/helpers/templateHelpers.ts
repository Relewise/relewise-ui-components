type StringTransformationResult<T> = T extends string ? string : T;

export function stripHtmlClientSide<T>(value: T): StringTransformationResult<T> {
    if (typeof value !== 'string') {
        return value as StringTransformationResult<T>;
    }

    if (typeof document !== 'undefined') {
        const container = document.createElement('div');
        container.innerHTML = value;
        return (container.textContent ?? container.innerText ?? '') as StringTransformationResult<T>;
    }

    console.error('Relewise web component: stripHtmlClientSide can only be executed in a browser environment. Returning the raw string.');
    return value as StringTransformationResult<T>;
}

export const templateHelpers = {
    stripHtmlClientSide,
};

export type TemplateHelpers = typeof templateHelpers;
