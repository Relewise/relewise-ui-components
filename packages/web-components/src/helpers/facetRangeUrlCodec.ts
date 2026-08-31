export type FacetRange = {
    lowerBoundInclusive: number | null;
    upperBoundExclusive: number | null;
};

export function serializeFacetRange(range: FacetRange): string {
    return JSON.stringify([range.lowerBoundInclusive, range.upperBoundExclusive]);
}

export function deserializeFacetRange(value: string): FacetRange | null {
    try {
        const parsedValue: unknown = JSON.parse(value);
        if (Array.isArray(parsedValue)
            && parsedValue.length === 2
            && isNullableNumber(parsedValue[0])
            && isNullableNumber(parsedValue[1])) {
            return {
                lowerBoundInclusive: parsedValue[0],
                upperBoundExclusive: parsedValue[1],
            };
        }
    } catch {
        const legacyRange = value.match(/^(-?\d+(?:\.\d+)?)-(-?\d+(?:\.\d+)?)$/);
        if (legacyRange) {
            return {
                lowerBoundInclusive: Number(legacyRange[1]),
                upperBoundExclusive: Number(legacyRange[2]),
            };
        }
    }

    return null;
}

function isNullableNumber(value: unknown): value is number | null {
    return value === null || (typeof value === 'number' && Number.isFinite(value));
}
