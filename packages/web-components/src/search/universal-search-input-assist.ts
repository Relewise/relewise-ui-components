import type { SearchResponseCollection, SearchTermPredictionResponse, Settings } from '@relewise/client';
import { html, nothing } from 'lit';
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { getRelewiseContextSettings, getRelewiseUIOptions, getRelewiseUISearchOptions } from '../helpers';
import { getRecommender } from '../recommendations/recommender';
import type { UniversalSearchBatchSearch, UniversalSearchTab } from './universal-search.types';
import { buildPopularSearchTermsRequest, buildSearchTermPredictionRequest } from './universalSearchInputAssistRequestBuilder';

type UniversalSearchInputAssistControllerOptions = {
    getTerm: () => string;
    getEnabledTabs: () => UniversalSearchTab[];
    getDisplayedAtLocation: () => string | undefined;
    getAccessibilityId: () => string;
    setSearchTerm: (term: string) => void;
    submitSearchTerm: () => void;
    close: () => void;
};

const defaultTake = 5;

export class UniversalSearchInputAssistController implements ReactiveController {
    private popularSearchTerms: string[] = [];
    private searchTermPredictions: string[] = [];
    private searchBarInFocus = false;
    private dismissed = false;
    private selectedIndex = -1;
    private abortController = new AbortController();

    constructor(
        private readonly host: ReactiveControllerHost,
        private readonly options: UniversalSearchInputAssistControllerOptions,
    ) {
        this.host.addController(this);
    }

    hostDisconnected(): void {
        this.abortController.abort();
    }

    get enabled(): boolean {
        const options = getRelewiseUISearchOptions()?.universalSearch?.inputAssist;
        return Boolean(options?.popularSearchTerms || options?.searchTermPredictions);
    }

    get expanded(): boolean {
        return this.visibleTerms.length > 0;
    }

    get listId(): string {
        return `${this.options.getAccessibilityId()}-input-assist`;
    }

    get activeDescendantId(): string | null {
        if (this.selectedIndex < 0 || !this.visibleTerms[this.selectedIndex]) {
            return null;
        }

        return this.getOptionId(this.selectedIndex);
    }

    close(): void {
        if (!this.enabled) {
            return;
        }

        this.abortController.abort();
        this.searchBarInFocus = false;
        this.dismissed = true;
        this.selectedIndex = -1;
        this.popularSearchTerms = [];
        this.searchTermPredictions = [];
        this.host.requestUpdate();
    }

    handleSearchTermInput(term: string): void {
        if (!this.enabled) {
            this.options.setSearchTerm(term);
            return;
        }

        this.abortController.abort();
        this.dismissed = false;
        this.selectedIndex = -1;
        this.searchTermPredictions = [];
        this.options.setSearchTerm(term);

        if (!term && this.searchBarInFocus) {
            void this.loadPopularSearchTerms();
        }
    }

    handleSearchBarFocus(inFocus: boolean): void {
        if (!this.enabled) {
            return;
        }

        this.searchBarInFocus = inFocus;

        if (!inFocus) {
            this.dismiss();
            return;
        }

        this.dismissed = false;
        this.selectedIndex = -1;
        this.host.requestUpdate();

        if (!this.options.getTerm() && this.popularSearchTerms.length === 0) {
            void this.loadPopularSearchTerms();
        }
    }

    handleKeyEvent(event: KeyboardEvent): void {
        if (!this.enabled) {
            if (event.key === 'Escape') {
                event.preventDefault();
                this.options.close();
            }
            return;
        }

        const terms = this.visibleTerms;

        if (event.key === 'ArrowDown' && terms.length > 0) {
            event.preventDefault();
            this.selectedIndex = Math.min(this.selectedIndex + 1, terms.length - 1);
            this.host.requestUpdate();
            return;
        }

        if (event.key === 'ArrowUp' && terms.length > 0) {
            event.preventDefault();
            this.selectedIndex = this.selectedIndex < 0
                ? terms.length - 1
                : Math.max(this.selectedIndex - 1, 0);
            this.host.requestUpdate();
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            const selectedTerm = terms[this.selectedIndex];
            if (selectedTerm) {
                this.selectTerm(selectedTerm);
            } else {
                this.dismiss();
                this.options.submitSearchTerm();
            }
            return;
        }

        if (event.key !== 'Escape') {
            return;
        }

        event.preventDefault();
        if (terms.length > 0) {
            event.stopPropagation();
            this.dismiss();
        } else {
            this.options.close();
        }
    }

    dismissWhenClickingOutside(event: PointerEvent): void {
        if (!this.enabled) {
            return;
        }

        const clickedInsideSearchBar = event.composedPath().some(target =>
            target instanceof HTMLElement && target.localName === 'relewise-search-bar');

        if (!clickedInsideSearchBar) {
            this.dismiss();
        }
    }

    prepareBatchSearch(settings: Settings): UniversalSearchBatchSearch | null {
        const options = getRelewiseUISearchOptions()?.universalSearch?.inputAssist?.searchTermPredictions;
        const take = options?.take ?? defaultTake;
        const tabs = this.options.getEnabledTabs();
        const term = this.options.getTerm();

        if (!options || take <= 0 || tabs.length === 0 || !this.searchBarInFocus || !term || this.dismissed) {
            return null;
        }

        return {
            request: buildSearchTermPredictionRequest({
                settings,
                term,
                take,
                tabs,
            }),
            applyResponse: response => this.applySearchTermPredictionResponse(response),
            setError: () => {
                this.searchTermPredictions = [];
                this.host.requestUpdate();
            },
        };
    }

    render() {
        const terms = this.visibleTerms;
        if (terms.length === 0) {
            return nothing;
        }

        const assistType = this.options.getTerm() ? 'predictions' : 'popular-search-terms';
        const localization = getRelewiseUISearchOptions()?.localization?.universalSearch;

        return html`
            <div
                class="rw-input-assist"
                part="input-assist ${assistType}"
                @pointerdown=${(event: PointerEvent) => event.preventDefault()}>
                <ul
                    id=${this.listId}
                    class="rw-input-assist-list"
                    part="input-assist-list"
                    role="listbox"
                    aria-label=${localization?.inputAssistLabel ?? 'Search suggestions'}>
                    ${terms.map((term, index) => html`
                        <li role="none">
                            <button
                                class="rw-input-assist-item"
                                part="input-assist-item"
                                type="button"
                                id=${this.getOptionId(index)}
                                role="option"
                                tabindex="-1"
                                aria-selected=${this.selectedIndex === index ? 'true' : 'false'}
                                ?data-selected=${this.selectedIndex === index}
                                @pointerenter=${() => {
                                    if (this.selectedIndex === index) {
                                        return;
                                    }

                                    this.selectedIndex = index;
                                    this.host.requestUpdate();
                                }}
                                @click=${() => this.selectTerm(term)}>
                                ${term}
                            </button>
                        </li>
                    `)}
                </ul>
            </div>
        `;
    }

    private dismiss(): void {
        this.abortController.abort();
        this.dismissed = true;
        this.selectedIndex = -1;
        this.host.requestUpdate();
    }

    private getOptionId(index: number): string {
        return `${this.listId}-option-${index}`;
    }

    private selectTerm(term: string): void {
        this.dismiss();
        this.options.setSearchTerm(term);
        this.options.submitSearchTerm();
    }

    private get visibleTerms(): string[] {
        if (!this.searchBarInFocus || this.dismissed) {
            return [];
        }

        return this.options.getTerm() ? this.searchTermPredictions : this.popularSearchTerms;
    }

    private async loadPopularSearchTerms(): Promise<void> {
        const options = getRelewiseUISearchOptions()?.universalSearch?.inputAssist?.popularSearchTerms;
        const take = options?.take ?? defaultTake;
        const tabs = this.options.getEnabledTabs();

        if (!options || take <= 0 || tabs.length === 0 || !this.searchBarInFocus || this.options.getTerm() || this.dismissed) {
            return;
        }

        this.abortController.abort();
        const abortController = new AbortController();
        this.abortController = abortController;

        try {
            const settings = await getRelewiseContextSettings(this.options.getDisplayedAtLocation() ?? 'Relewise Universal Search');
            if (abortController.signal.aborted || !this.searchBarInFocus || this.options.getTerm() || this.dismissed) {
                return;
            }

            const response = await getRecommender(getRelewiseUIOptions()).recommendPopularSearchTerms(buildPopularSearchTermsRequest({
                settings,
                take,
                tabs,
            }), { abortSignal: abortController.signal });

            if (!abortController.signal.aborted && this.searchBarInFocus && !this.options.getTerm() && !this.dismissed) {
                this.popularSearchTerms = response?.recommendations
                    ?.map(recommendation => recommendation.term)
                    .filter((term): term is string => term !== null && term !== undefined) ?? [];
                this.host.requestUpdate();
            }
        } catch {
            if (!abortController.signal.aborted) {
                this.popularSearchTerms = [];
                this.host.requestUpdate();
            }
        }
    }

    private applySearchTermPredictionResponse(response: SearchResponseCollection): void {
        const predictionResponse = response.responses?.find(item => '$type' in item
            && typeof item.$type === 'string'
            && item.$type.includes('SearchTermPredictionResponse')) as SearchTermPredictionResponse | undefined;
        this.searchTermPredictions = predictionResponse?.predictions
            ?.map(prediction => prediction.term)
            .filter((prediction): prediction is string => prediction !== null && prediction !== undefined) ?? [];
        this.selectedIndex = -1;
        this.host.requestUpdate();
    }
}
