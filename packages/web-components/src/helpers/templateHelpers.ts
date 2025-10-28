export type StripHtmlResult<T> = T extends string ? string : T;

export function stripHtml<T>(value: T): StripHtmlResult<T> {
    if (typeof value !== 'string') {
        return value as StripHtmlResult<T>;
    }

    if (typeof document !== 'undefined') {
        const container = document.createElement('div');
        container.innerHTML = value;
        return (container.textContent ?? container.innerText ?? '') as StripHtmlResult<T>;
    }

    return value.replace(/<[^>]+>/g, '') as StripHtmlResult<T>;
}
