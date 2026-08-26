import type { RedirectResult, SearchResponseCollection, SearchTermPredictionResponse, Settings } from '@relewise/client';
import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { getRelewiseContextSettings, getRelewiseUIOptions, getRelewiseUISearchOptions } from '../../helpers';
import { getRecommender } from '../../recommendations/recommender';
import { RelewiseLitElement } from '../../relewise-lit-element';
import type { SearchSuggestionEntityType, SearchSuggestionsOptions } from '../../app';
import { canParseRedirectDestination } from '../../helpers/searchRedirect';
import { buildPopularSearchTermsRequest, buildSearchTermPredictionRequest } from '../../builders/searchSuggestionsRequestBuilder';
import { searchComboboxStyles } from './search-combobox.styles';
import type { SearchComboboxRedirectEventDetail, SearchComboboxTermEventDetail, SearchSuggestionsBatchSearch } from './search-combobox.types';

type SearchComboboxSuggestion =
    | { redirect: RedirectResult; term?: never }
    | { redirect?: never; term: string };

const defaultTake = 5;
const searchTermPredictionResponseType = 'Relewise.Client.Responses.Search.SearchTermPredictionResponse, Relewise.Client';
let searchComboboxInstanceId = 0;

export const SearchComboboxEvents = {
    termChanged: 'relewise-search-combobox-term-changed',
    searchSubmitted: 'relewise-search-combobox-search-submitted',
    redirectSelected: 'relewise-search-combobox-redirect-selected',
    escapeRequested: 'relewise-search-combobox-escape-requested',
} as const;

export class SearchCombobox extends RelewiseLitElement {
    @property()
    term = '';

    @property({ attribute: false })
    suggestions?: SearchSuggestionsOptions;

    @property({ attribute: false })
    targetEntityTypes: SearchSuggestionEntityType[] = [];

    @property({ attribute: false })
    redirects: RedirectResult[] = [];

    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string;

    @property()
    placeholder: string | null = null;

    @property({ type: Boolean, reflect: true })
    autofocus = false;

    @state() private popularSearchTerms: string[] = [];
    @state() private searchTermPredictions: string[] = [];
    @state() private inputInFocus = false;
    @state() private dismissed = false;
    @state() private selectedIndex = -1;

    private readonly accessibilityId = `relewise-search-combobox-${searchComboboxInstanceId++}`;
    private popularSearchTermsAbortController = new AbortController();
    private popularSearchTermsState: 'idle' | 'loading' | 'loaded' = 'idle';
    private readonly handleDocumentPointerDownBound = this.handleDocumentPointerDown.bind(this);

    connectedCallback(): void {
        super.connectedCallback();
        document.addEventListener('pointerdown', this.handleDocumentPointerDownBound);
    }

    disconnectedCallback(): void {
        document.removeEventListener('pointerdown', this.handleDocumentPointerDownBound);
        this.abortPopularSearchTermsRequest();
        this.popularSearchTermsState = 'idle';
        this.popularSearchTerms = [];
        this.searchTermPredictions = [];
        super.disconnectedCallback();
    }

    firstUpdated(): void {
        if (this.autofocus) {
            void this.updateComplete.then(() => this.focusSearchInput());
        }
    }

    get suggestionsEnabled(): boolean {
        return Boolean(this.suggestions?.popularSearchTerms
            || this.suggestions?.searchTermPredictions
            || this.redirectSuggestions.length > 0);
    }

    prepareBatchSearch(settings: Settings): SearchSuggestionsBatchSearch | null {
        const options = this.suggestions?.searchTermPredictions;
        const take = options?.take ?? defaultTake;
        const targetEntityTypes = options?.targetEntityTypes ?? this.targetEntityTypes;

        if (!options || take <= 0 || targetEntityTypes.length === 0 || !this.inputInFocus || !this.term || this.dismissed) {
            return null;
        }

        const requestedTerm = this.term;
        const responseIsCurrent = () => this.term === requestedTerm && this.inputInFocus && !this.dismissed;

        return {
            request: buildSearchTermPredictionRequest({
                settings,
                term: requestedTerm,
                take,
                targetEntityTypes,
            }),
            applyResponse: response => {
                if (responseIsCurrent()) {
                    this.applySearchTermPredictionResponse(response);
                }
            },
            setError: () => {
                if (responseIsCurrent()) {
                    this.searchTermPredictions = [];
                }
            },
        };
    }

    private handleDocumentPointerDown(event: PointerEvent): void {
        if (!this.suggestionsEnabled || event.composedPath().includes(this)) {
            return;
        }

        this.dismissSuggestions();
    }

    private focusSearchInput(): void {
        this.renderRoot.querySelector<HTMLInputElement>('#search-input')?.focus();
    }

    private clearSearch(): void {
        this.handleSearchTermInput('');
        void this.updateComplete.then(() => this.focusSearchInput());
    }

    private handleSearchTermInput(term: string): void {
        if (!this.suggestionsEnabled) {
            this.updateTerm(term);
            return;
        }

        this.abortPopularSearchTermsRequest();
        this.dismissed = false;
        this.selectedIndex = -1;
        this.searchTermPredictions = [];
        this.updateTerm(term);

        if (!term && this.inputInFocus) {
            void this.loadPopularSearchTerms();
        }
    }

    private handleInputFocus(inFocus: boolean): void {
        this.inputInFocus = inFocus;

        if (!this.suggestionsEnabled) {
            return;
        }

        if (!inFocus) {
            this.dismissSuggestions();
            return;
        }

        this.dismissed = false;
        this.selectedIndex = -1;

        if (!this.term && this.popularSearchTerms.length === 0) {
            void this.loadPopularSearchTerms();
        }
    }

    private handleKeyEvent(event: KeyboardEvent): void {
        if (!this.suggestionsEnabled) {
            if (event.key === 'Escape') {
                event.preventDefault();
                this.requestEscape();
            } else if (event.key === 'Enter') {
                event.preventDefault();
                this.submitSearch();
            }
            return;
        }

        const suggestions = this.visibleSuggestions;

        if (event.key === 'ArrowDown' && suggestions.length > 0) {
            event.preventDefault();
            this.selectedIndex = Math.min(this.selectedIndex + 1, suggestions.length - 1);
            return;
        }

        if (event.key === 'ArrowUp' && suggestions.length > 0) {
            event.preventDefault();
            this.selectedIndex = this.selectedIndex < 0
                ? suggestions.length - 1
                : Math.max(this.selectedIndex - 1, 0);
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            const selectedSuggestion = suggestions[this.selectedIndex];
            if (selectedSuggestion) {
                this.selectSuggestion(selectedSuggestion);
            } else {
                this.dismissSuggestions();
                this.submitSearch();
            }
            return;
        }

        if (event.key !== 'Escape') {
            return;
        }

        event.preventDefault();
        if (suggestions.length > 0) {
            event.stopPropagation();
            this.dismissSuggestions();
        } else {
            this.requestEscape();
        }
    }

    private dismissSuggestions(): void {
        this.abortPopularSearchTermsRequest();
        this.dismissed = true;
        this.selectedIndex = -1;
    }

    private abortPopularSearchTermsRequest(): void {
        this.popularSearchTermsAbortController.abort();
        if (this.popularSearchTermsState === 'loading') {
            this.popularSearchTermsState = 'idle';
        }
    }

    private updateTerm(term: string): void {
        this.term = term;
        this.dispatchEvent(new CustomEvent<SearchComboboxTermEventDetail>(SearchComboboxEvents.termChanged, {
            bubbles: true,
            composed: true,
            detail: { term },
        }));
    }

    private submitSearch(): void {
        this.dispatchEvent(new CustomEvent<SearchComboboxTermEventDetail>(SearchComboboxEvents.searchSubmitted, {
            bubbles: true,
            composed: true,
            detail: { term: this.term },
        }));
    }

    private requestEscape(): void {
        this.dispatchEvent(new CustomEvent(SearchComboboxEvents.escapeRequested, {
            bubbles: true,
            composed: true,
        }));
    }

    private get listId(): string {
        return `${this.accessibilityId}-suggestions`;
    }

    private getOptionId(index: number): string {
        return `${this.listId}-option-${index}`;
    }

    private get activeDescendantId(): string | null {
        if (this.selectedIndex < 0 || !this.visibleSuggestions[this.selectedIndex]) {
            return null;
        }

        return this.getOptionId(this.selectedIndex);
    }

    private selectSuggestion(suggestion: SearchComboboxSuggestion): void {
        this.dismissSuggestions();
        if (suggestion.redirect) {
            this.dispatchEvent(new CustomEvent<SearchComboboxRedirectEventDetail>(SearchComboboxEvents.redirectSelected, {
                bubbles: true,
                composed: true,
                detail: { destination: suggestion.redirect.destination! },
            }));
            return;
        }

        this.updateTerm(suggestion.term);
        this.submitSearch();
    }

    private get redirectSuggestions(): RedirectResult[] {
        return this.redirects.filter(redirect => redirect.data?.Title && canParseRedirectDestination(redirect.destination));
    }

    private get visibleSuggestions(): SearchComboboxSuggestion[] {
        if (!this.inputInFocus || this.dismissed) {
            return [];
        }

        if (!this.term) {
            return this.popularSearchTerms.map(term => ({ term }));
        }

        return [
            ...this.redirectSuggestions.map(redirect => ({ redirect })),
            ...this.searchTermPredictions.map(term => ({ term })),
        ];
    }

    private async loadPopularSearchTerms(): Promise<void> {
        const options = this.suggestions?.popularSearchTerms;
        const take = options?.take ?? defaultTake;
        const targetEntityTypes = options?.targetEntityTypes ?? this.targetEntityTypes;

        if (!options
            || take <= 0
            || targetEntityTypes.length === 0
            || this.popularSearchTermsState !== 'idle'
            || !this.inputInFocus
            || this.term
            || this.dismissed) {
            return;
        }

        this.abortPopularSearchTermsRequest();
        const abortController = new AbortController();
        this.popularSearchTermsAbortController = abortController;
        this.popularSearchTermsState = 'loading';

        try {
            const settings = await getRelewiseContextSettings(this.displayedAtLocation ?? 'Relewise Search Combobox');
            if (abortController.signal.aborted || !this.inputInFocus || this.term || this.dismissed) {
                return;
            }

            const response = await getRecommender(getRelewiseUIOptions()).recommendPopularSearchTerms(buildPopularSearchTermsRequest({
                settings,
                take,
                targetEntityTypes,
            }), { abortSignal: abortController.signal });

            if (!abortController.signal.aborted && this.inputInFocus && !this.term && !this.dismissed) {
                this.popularSearchTerms = response?.recommendations
                    ?.map(recommendation => recommendation.term)
                    .filter((term): term is string => term !== null && term !== undefined) ?? [];
                this.popularSearchTermsState = 'loaded';
            }
        } catch {
            if (!abortController.signal.aborted) {
                this.popularSearchTerms = [];
            }
        } finally {
            if (this.popularSearchTermsAbortController === abortController && this.popularSearchTermsState === 'loading') {
                this.popularSearchTermsState = 'idle';
            }
        }
    }

    private applySearchTermPredictionResponse(response: SearchResponseCollection): void {
        const predictionResponse = response.responses?.find(item => '$type' in item
            && item.$type === searchTermPredictionResponseType) as SearchTermPredictionResponse | undefined;
        this.searchTermPredictions = predictionResponse?.predictions
            ?.map(prediction => prediction.term)
            .filter((prediction): prediction is string => prediction !== null && prediction !== undefined && prediction !== this.term) ?? [];
        this.selectedIndex = -1;
    }

    render() {
        const suggestions = this.visibleSuggestions;
        const expanded = suggestions.length > 0;
        const suggestionType = this.term ? 'predictions' : 'popular-search-terms';
        const suggestionsLabel = getRelewiseUISearchOptions()?.localization?.searchSuggestions?.label ?? 'Search suggestions';
        const clearSearchLabel = getRelewiseUISearchOptions()?.localization?.searchBar?.clear ?? 'Clear search';

        return html`
            <div class="rw-search-combobox">
                <div class="rw-search-bar rw-border" part="search-input">
                    <input
                        id="search-input"
                        autocomplete="off"
                        class="rw-search-bar-input"
                        type="text"
                        role=${this.suggestionsEnabled ? 'combobox' : nothing}
                        aria-autocomplete=${this.suggestionsEnabled ? 'list' : nothing}
                        aria-expanded=${this.suggestionsEnabled ? String(expanded) : nothing}
                        aria-controls=${expanded ? this.listId : nothing}
                        aria-activedescendant=${expanded ? this.activeDescendantId ?? nothing : nothing}
                        placeholder=${this.placeholder ?? 'Search'}
                        aria-label=${this.placeholder ?? 'Search'}
                        .value=${this.term}
                        @keydown=${this.handleKeyEvent}
                        @input=${(event: InputEvent) => this.handleSearchTermInput((event.target as HTMLInputElement).value)}
                        @focus=${() => this.handleInputFocus(true)}
                        @blur=${() => this.handleInputFocus(false)}>
                    ${this.term ? html`
                        <button
                            class="rw-icon"
                            part="clear-search"
                            type="button"
                            aria-label=${clearSearchLabel}
                            @click=${this.clearSearch}>
                            <relewise-x-icon exportparts="icon: search-icon"></relewise-x-icon>
                        </button>
                    ` : html`
                        <div class="rw-icon" @click=${() => this.focusSearchInput()}>
                            <relewise-search-icon exportparts="icon: search-icon"></relewise-search-icon>
                        </div>
                    `}
                </div>
                ${expanded ? html`
                    <div
                        class="rw-search-suggestions"
                        part="search-suggestions ${suggestionType}"
                        @pointerdown=${(event: PointerEvent) => event.preventDefault()}>
                        <ul
                            id=${this.listId}
                            class="rw-search-suggestions-list"
                            part="suggestions-list"
                            role="listbox"
                            aria-label=${suggestionsLabel}>
                            ${suggestions.map((suggestion, index) => html`
                                <li role="none">
                                    <button
                                        class="rw-search-suggestion"
                                        part="suggestion"
                                        type="button"
                                        id=${this.getOptionId(index)}
                                        role="option"
                                        tabindex="-1"
                                        aria-selected=${this.selectedIndex === index ? 'true' : 'false'}
                                        ?data-selected=${this.selectedIndex === index}
                                        @pointerenter=${() => this.selectedIndex = index}
                                        @click=${() => this.selectSuggestion(suggestion)}>
                                        <span>${suggestion.redirect?.data?.Title ?? suggestion.term}</span>
                                        ${suggestion.redirect ? html`
                                            <relewise-arrow-up-icon
                                                class="rw-suggestion-icon"
                                                part="suggestion-icon"
                                                aria-hidden="true">
                                            </relewise-arrow-up-icon>
                                        ` : html`
                                            <relewise-search-icon
                                                class="rw-suggestion-icon"
                                                part="suggestion-icon"
                                                aria-hidden="true">
                                            </relewise-search-icon>
                                        `}
                                    </button>
                                </li>
                            `)}
                        </ul>
                    </div>
                ` : nothing}
            </div>
        `;
    }

    static styles = searchComboboxStyles;
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-search-combobox': SearchCombobox;
    }

    interface HTMLElementEventMap {
        'relewise-search-combobox-term-changed': CustomEvent<SearchComboboxTermEventDetail>;
        'relewise-search-combobox-search-submitted': CustomEvent<SearchComboboxTermEventDetail>;
        'relewise-search-combobox-redirect-selected': CustomEvent<SearchComboboxRedirectEventDetail>;
        'relewise-search-combobox-escape-requested': CustomEvent;
    }
}
