import { FilterBuilder } from '@relewise/client';

export class NamedFilters {
    private templates = new Map<string, (builder: FilterBuilder) => void>();

    constructor(initialValues?: (builder: NamedFilters) => void) {
        if (initialValues) initialValues(this);
    }

    add(options: {
        name: string;
        builder: (builder: FilterBuilder) => void;
    }): this {

        this.templates.set(options.name, options.builder);

        return this;
    }

    has(name: string): boolean {
        return this.templates.has(name);
    }

    handled(name: string, builder: FilterBuilder) {
        console.log(this.templates.has(name));

        const tmpl = this.templates.get(name);
        if (tmpl) {
            tmpl(builder);
        }
        else {
            console.error(`Relewise Web Components: Could not find filter template with name: '${name}'`);
        }
    }
}