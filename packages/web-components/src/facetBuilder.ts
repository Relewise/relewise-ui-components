import { FacetBuilder } from '@relewise/client';

export class RelewiseFacetBuilder {
    builder: FacetBuilder;
    private labels: string[] = [];

    constructor(builder: FacetBuilder) {
        this.builder = builder;
    }

    addFacet(facet: (builder: FacetBuilder) => void, options: { heading: string }): this {
        this.labels.push(options.heading);

        facet(this.builder);
        return this;
    }

    getLabels(): string[] {
        return this.labels;
    }
}