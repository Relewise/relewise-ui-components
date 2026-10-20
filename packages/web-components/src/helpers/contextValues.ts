import type { GetContextValues } from '../initialize';

export async function resolveContextValues(
    ...getContextValues: Array<GetContextValues | undefined>
): Promise<Record<string, string> | null> {
    const contextValues = await Promise.all(
        getContextValues.map(provider => provider?.() ?? {}),
    );
    const mergedContextValues = Object.assign({}, ...contextValues);
    return Object.keys(mergedContextValues).length > 0 ? mergedContextValues : null;
}
