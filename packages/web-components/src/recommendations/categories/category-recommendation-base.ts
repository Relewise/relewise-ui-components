import { css, html, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events } from '../../helpers/events';
import { RecommendationStateElement } from '../recommendation-state';

export abstract class CategoryRecommendationBase<TCategory, TRequest> extends RecommendationStateElement {

    @property({ type: String, attribute: 'target' })
    target: string | null = null;

    @property({ type: Number, attribute: 'number-of-recommendations' })
    numberOfRecommendations = 4;

    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string;

    @state()
    categories: TCategory[] | null = null;

    private requestGeneration = 0;
    private loading = false;

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
        this.requestGeneration++;
        window.removeEventListener(Events.contextSettingsUpdated, this.fetchAndUpdateCategoriesBound);
        super.disconnectedCallback();
    }

    private async fetchAndUpdateCategories() {
        const generation = ++this.requestGeneration;
        this.loading = true;
        this.reportCurrentRecommendationState();

        try {
            const result = await this.fetchCategories();

            if (generation !== this.requestGeneration || !this.isConnected) {
                return;
            }

            this.categories = result?.recommendations ?? null;
        } catch {
            if (generation === this.requestGeneration && this.isConnected) {
                this.categories = null;
            }
        } finally {
            if (generation === this.requestGeneration && this.isConnected) {
                this.loading = false;
                this.reportCurrentRecommendationState();
            }
        }
    }

    private reportCurrentRecommendationState(): void {
        this.reportRecommendationState({
            loading: this.loading,
            hasResults: Boolean(this.categories?.length),
        });
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
            grid-template-columns: repeat(var(--relewise-recommendation-grid-columns, 4), minmax(0, 1fr));
            gap: var(--relewise-recommendation-grid-gap, 1em);
            grid-auto-rows: 1fr;
        }

        @media (max-width: 768px) {
            :host {
                grid-template-columns: repeat(var(--relewise-recommendation-grid-mobile-columns, 2), minmax(0, 1fr));
            }
        }
    `;
}
