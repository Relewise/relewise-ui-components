export function mergeContextValues(
    ...contextValues: Array<Record<string, string> | undefined>
): Record<string, string> | null {
    const mergedContextValues = Object.assign({}, ...contextValues.filter(values => values !== undefined));
    return Object.keys(mergedContextValues).length > 0 ? mergedContextValues : null;
}
