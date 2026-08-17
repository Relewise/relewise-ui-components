import { User } from '@relewise/client';
import { css, html, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events } from '../../helpers/events';
import { getRelewiseUIOptions } from '../../helpers/relewiseUIOptions';
import { RelewiseLitElement } from '../../relewise-lit-element';

export abstract class CategoryRecommendationBase<TCategory, TRequest> extends RelewiseLitElement {

    @property({ type: String, attribute: 'target' })
    target: string | null = null;

    @property({ type: Number, attribute: 'number-of-recommendations' })
    numberOfRecommendations = 4;

    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string;

    @state()
    categories: TCategory[] | null = null;

    @state()
    protected user: User | null = null;

    abstract fetchCategories(): Promise<{ recommendations?: TCategory[] | null } | undefined> | undefined;
    abstract buildRequest(): Promise<TRequest | undefined>;
    protected abstract renderCategory(category: TCategory): TemplateResult;

    private readonly fetchAndUpdateCategoriesBound = this.fetchAndUpdateCategories.bind(this);

    connectedCallback() {
        super.connectedCallback();
        if (!this.displayedAtLocation) {
            console.error('Missing displayed-at-location attribute on recommendation component.');
        }

        window.addEventListener(Events.contextSettingsUpdated, this.fetchAndUpdateCategoriesBound);
        void this.fetchAndUpdateCategories();
    }

    disconnectedCallback() {
        window.removeEventListener(Events.contextSettingsUpdated, this.fetchAndUpdateCategoriesBound);
        super.disconnectedCallback();
    }

    private async fetchAndUpdateCategories() {
        this.user = await getRelewiseUIOptions().contextSettings.getUser();
        const result = await this.fetchCategories();
        this.categories = result?.recommendations ?? null;
    }

    render() {
        if (!this.categories || this.categories.length === 0) {
            return;
        }

        return html`${this.categories.map(category => this.renderCategory(category))}`;
    }

    static styles = css`
        :host {
            display: grid;
            width: 100%;
            grid-template-columns: repeat(4, 1fr);
            gap: 1em;
            grid-auto-rows: 1fr;
        }

        @media (max-width: 768px) {
            :host {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    `;
}
