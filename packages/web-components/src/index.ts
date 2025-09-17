import type { RelewiseIntrinsicElements } from './jsx';

export * from './components';
export * from './recommendations';
export * from './helpers';
export * from './builders';
export * from './initialize';
export * from './defaultSettings';
export * from './tracking';
export * from './updateContextSettings';
export * from './facetBuilder';
export * from './app';
export * from './search';
export * from './theme';
export * from './targetedSearchConfigurations';
export * from './targetedRecommendationConfigurations';
export type {
    RelewiseElementName,
    StyleLike,
    RelewiseElementProps,
    RelewiseIntrinsicElements,
    RelewiseJSXIntrinsicElements,
} from './jsx';

declare global {
    namespace JSX {
        interface IntrinsicElements extends RelewiseIntrinsicElements {}
    }
}
