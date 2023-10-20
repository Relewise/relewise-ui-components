export class FacetResult {
    id?: string | null;
    displayName?: string | null;

    constructor(id: string | null, displayName: string | null) {
        this.id = id;
        this.displayName = displayName;
    }
}