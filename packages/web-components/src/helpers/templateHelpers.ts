type StringTransformationResult<T> = T extends string ? string : T;

export function stripHtml<T>(value: T): StringTransformationResult<T> {
    if (typeof value !== 'string') {
        return value as StringTransformationResult<T>;
    }

    if (typeof document !== 'undefined') {
        const container = document.createElement('div');
        container.innerHTML = value;
        return (container.textContent ?? container.innerText ?? '') as StringTransformationResult<T>;
    }

    return value.replace(/<[^>]+>/g, '') as StringTransformationResult<T>;
}

export const templateHelpers = {
    stripHtml,
};

export type TemplateHelpers = typeof templateHelpers;
