import { FilterBuilder } from '@relewise/client';

export class FilterTemplates {
    private templates = new Map<string, (builder: FilterBuilder) => void>();

    constructor(initialValues?: (builder: FilterTemplates) => void) {
        console.log(initialValues);
        if (initialValues) initialValues(this);
    }

    addTemplate(options: {
        name: string;
        builder: (builder: FilterBuilder) => void;
    }): this {

        this.templates.set(options.name, options.builder);

        return this;
    }

    hasTemplate(name: string): boolean {
        return this.templates.has(name);
    }

    handleTemplate(name: string, builder: FilterBuilder) {
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