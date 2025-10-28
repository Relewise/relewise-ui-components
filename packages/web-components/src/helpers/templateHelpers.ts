type StringTransformationResult<T> = T extends string ? string : T;

function asStringIfPossible<T>(value: T, transform: (input: string) => string): StringTransformationResult<T> {
    if (typeof value !== 'string') {
        return value as StringTransformationResult<T>;
    }

    return transform(value) as StringTransformationResult<T>;
}

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

export function toUpperCase<T>(value: T): StringTransformationResult<T> {
    return asStringIfPossible(value, input => input.toUpperCase());
}

export function toLowerCase<T>(value: T): StringTransformationResult<T> {
    return asStringIfPossible(value, input => input.toLowerCase());
}

export const templateHelpers = {
    stripHtml,
    toUpperCase,
    toLowerCase,
};

export type TemplateHelpers = typeof templateHelpers;
