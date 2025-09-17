export {};

export type RelewiseElementName = Extract<keyof HTMLElementTagNameMap, `relewise-${string}`>;

export type StyleLike = string | Partial<CSSStyleDeclaration> | Record<string, string | number | null | undefined>;

export type RelewiseElementProps<K extends RelewiseElementName> = Partial<HTMLElementTagNameMap[K]> & {
    class?: string;
    className?: string;
    part?: string;
    slot?: string;
    style?: StyleLike;
    children?: unknown;
    ref?: unknown;
    key?: string | number;
} & {
    [attribute: string]: unknown;
};

export type RelewiseIntrinsicElements = {
    [K in RelewiseElementName]: RelewiseElementProps<K>;
};

export type RelewiseJSXIntrinsicElements = RelewiseIntrinsicElements;
