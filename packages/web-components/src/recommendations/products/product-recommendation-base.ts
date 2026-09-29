import { ProductRecommendationRequest, ProductRecommendationResponse, ProductResult, User } from '@relewise/client';
import { css, html, nothing } from 'lit';
import type { PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events } from '../../helpers/events';
import { consume } from '@lit/context';
import { BatchingContextValue, context } from '../product-recommendation-batcher';
import { getRelewiseUIOptions } from '../../helpers';
import { RecommendationStateElement } from '../recommendation-state';

export abstract class ProductRecommendationBase extends RecommendationStateElement {
    private headingTemplate: HTMLTemplateElement | null = null;
    private headingElement: HTMLElement | null = null;

    @property({ type: String, attribute: 'target' })
    target: string | null = null;

    @property({ type: Number, attribute: 'number-of-recommendations' })
    numberOfRecommendations: number = 4;

    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string = undefined;

    @consume({ context, subscribe: true })
    @state()
    providedData?: BatchingContextValue;

    @state()
    products: ProductResult[] | null = null;

    @state()
    private user: User | null = null;

    private requestGeneration = 0;
    private loading = false;

    abstract fetchProducts(): Promise<ProductRecommendationResponse | undefined> | undefined;
    abstract buildRequest(): Promise<ProductRecommendationRequest | undefined>;

    fetchAndUpdateProductsBound = this.fetchAndUpdateProducts.bind(this);

    private get batchEnabled(): boolean {
        return this.providedData !== undefined && this.providedData.enabled !== false;
    }

    private get batchRequest() {
        return this.providedData?.requests.find(request => request.id === this);
    }

    private get renderedProducts(): ProductResult[] | null {
        const batchRequest = this.batchRequest;
        if (this.batchEnabled && batchRequest && 'result' in batchRequest) {
            return batchRequest.result?.recommendations ?? null;
        }

        return this.products;
    }

    // The template is inert; keep the same cloned heading across renders.
    private prepareHeading(): HTMLElement | null {
        const template = this.querySelector<HTMLTemplateElement>(':scope > template[slot="heading"]');
        if (template !== this.headingTemplate) {
            this.headingElement?.remove();
            this.headingTemplate = template;

            const content = template?.content.firstElementChild;
            this.headingElement = content instanceof HTMLElement
                ? document.importNode(content, true)
                : null;

            if (this.headingElement) {
                this.headingElement.slot = 'heading';
            }
        }

        return this.headingElement;
    }

    async connectedCallback() {
        super.connectedCallback();
        if (!this.displayedAtLocation) {
            console.error('Missing displayed-at-location attribute on recommendation component.');
        }

        window.addEventListener(Events.contextSettingsUpdated, this.fetchAndUpdateProductsBound);
        void this.fetchAndUpdateProducts();
    }

    disconnectedCallback() {
        this.requestGeneration++;
        window.removeEventListener(Events.contextSettingsUpdated, this.fetchAndUpdateProductsBound);

        super.disconnectedCallback();
    }

    protected willUpdate(changedProperties: PropertyValues<this>): void {
        // Fetch leaves loading true while the batcher works. Its result arrives through
        // providedData and schedules a render. Clear loading before that render so
        // products and their heading appear together; updated() would be too late.
        if (changedProperties.has('providedData')
            && this.batchEnabled
            && this.batchRequest
            && 'result' in this.batchRequest) {
            this.loading = false;
        }
    }

    protected updated(changedProperties: PropertyValues<this>): void {
        super.updated(changedProperties);

        const headingRendered = this.renderRoot.querySelector('.rw-recommendation-heading') !== null;
        this.toggleAttribute('has-heading', headingRendered);

        const heading = this.headingElement;
        // The cloned heading must be a direct child of the host for the native slot.
        if (headingRendered && this.renderRoot !== this && heading && !this.contains(heading)) {
            this.append(heading);
        }

        const previousData = changedProperties.get('providedData');
        if (previousData !== undefined && previousData.enabled !== false && !this.batchEnabled) {
            void this.fetchAndUpdateProducts();
            return;
        }

        if (changedProperties.has('providedData')
            && this.batchEnabled
            && this.batchRequest
            && 'result' in this.batchRequest) {
            this.reportCurrentRecommendationState();
        }
    }

    async fetchAndUpdateProducts() {
        const generation = ++this.requestGeneration;
        this.loading = true;
        this.reportCurrentRecommendationState();

        // Loading is not reactive, so hide an existing heading when a request starts.
        if (this.headingTemplate) {
            this.requestUpdate();
        }

        let waitingForBatch = false;

        try {
            const user = await getRelewiseUIOptions().contextSettings.getUser();

            if (generation !== this.requestGeneration || !this.isConnected) {
                return;
            }

            this.user = user;
            if (this.batchEnabled) {
                const request = await this.buildRequest();
                if (generation !== this.requestGeneration || !this.isConnected) {
                    return;
                }
                if (!request) {
                    this.products = null;
                    return;
                }

                waitingForBatch = true;
                this.dispatchEvent(new CustomEvent(Events.registerProductRecommendation, {
                    bubbles: true,
                    composed: true,
                    detail: request,
                }));
                return;
            }

            const result = await this.fetchProducts();

            if (generation !== this.requestGeneration || !this.isConnected) {
                return;
            }

            this.products = result?.recommendations ?? null;
        } catch {
            if (generation === this.requestGeneration && this.isConnected) {
                this.products = null;
            }
        } finally {
            if (generation === this.requestGeneration && this.isConnected && !waitingForBatch) {
                this.loading = false;
                this.reportCurrentRecommendationState();

                // The product array may be unchanged, but the heading must reappear.
                if (this.headingTemplate) {
                    this.requestUpdate();
                }
            }
        }
    };

    private reportCurrentRecommendationState(): void {
        this.reportRecommendationState({
            loading: this.loading,
            hasResults: Boolean(this.renderedProducts?.length),
        });
    }

    render() {
        const renderedProducts = this.renderedProducts;
        const products = html`${renderedProducts?.map(product =>
            html`<relewise-product-tile part="product-tile" .product=${product} .user=${this.user}></relewise-product-tile>`)}`;

        const lightDom = this.renderRoot === this;
        const heading = this.prepareHeading();
        // Light DOM rendering writes into the host, so retain the source template.
        const template = lightDom ? this.headingTemplate : null;

        if (!heading && !template) {
            return products;
        }

        const showHeading = !this.loading
            && Boolean(renderedProducts?.length)
            && Boolean(heading);

        return html`
            ${template ?? nothing}
            ${showHeading ? html`
                <div class="rw-recommendation-heading" part="heading">
                    ${lightDom ? heading : html`<slot name="heading"></slot>`}
                </div>
            ` : nothing}
            ${products}
        `;
    }

    static styles = css`
        :host([has-heading]) {
            grid-template-rows: auto;
        }

        .rw-recommendation-heading {
            grid-column: 1 / -1;
        }

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
