import type { SearchResponseCollection, SearchTermPredictionRequest, SearchTermPredictionResponse, Settings } from '@relewise/client';
import { css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { getRelewiseContextSettings, getRelewiseUIOptions } from '../../helpers';
import { getRecommender } from '../../recommendations/recommender';
import { RelewiseLitElement } from '../../relewise-lit-element';
import { theme } from '../../theme';
import { buildPopularSearchTermsRequest, buildSearchTermPredictionRequest } from '../searchSuggestionsRequestBuilder';
import type { SearchSuggestionEntityType, SearchSuggestionsOptions } from '../types';

const defaultTake = 5;
const searchTermPredictionResponseType = 'Relewise.Client.Responses.Search.SearchTermPredictionResponse, Relewise.Client';
let searchComboboxInstanceId = 0;

export type SearchSuggestionsBatchSearch = {
    request: SearchTermPredictionRequest;
    applyResponse: (response: SearchResponseCollection) => void;
    setError: () => void;
};

export class SearchCombobox extends RelewiseLitElement {
    @property()
    term = '';

    @property({ attribute: false })
    suggestions?: SearchSuggestionsOptions;

    @property({ attribute: false })
    targetEntityTypes: SearchSuggestionEntityType[] = [];

    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string;

    @property({ attribute: false })
    setSearchTerm = (term: string) => { };

    @property({ attribute: false })
    submitSearchTerm = () => { };

    @property({ attribute: false })
    handleEscape = () => { };

    @property()
    placeholder: string | null = null;

    @property()
    suggestionsLabel = 'Search suggestions';

    @property({ type: Boolean, reflect: true })
    autofocus = false;

    @state() private popularSearchTerms: string[] = [];
    @state() private searchTermPredictions: string[] = [];
    @state() private inputInFocus = false;
    @state() private dismissed = false;
    @state() private selectedIndex = -1;

    private readonly accessibilityId = `relewise-search-combobox-${searchComboboxInstanceId++}`;
    private abortController = new AbortController();

    disconnectedCallback(): void {
        this.abortController.abort();
        super.disconnectedCallback();
    }

    firstUpdated(): void {
        if (this.autofocus) {
            void this.updateComplete.then(() => this.focusSearchInput());
        }
    }

    get suggestionsEnabled(): boolean {
        return Boolean(this.suggestions?.popularSearchTerms || this.suggestions?.searchTermPredictions);
    }

    prepareBatchSearch(settings: Settings): SearchSuggestionsBatchSearch | null {
        const options = this.suggestions?.searchTermPredictions;
        const take = options?.take ?? defaultTake;

        if (!options || take <= 0 || this.targetEntityTypes.length === 0 || !this.inputInFocus || !this.term || this.dismissed) {
            return null;
        }

        return {
            request: buildSearchTermPredictionRequest({
                settings,
                term: this.term,
                take,
                targetEntityTypes: this.targetEntityTypes,
            }),
            applyResponse: response => this.applySearchTermPredictionResponse(response),
            setError: () => this.searchTermPredictions = [],
        };
    }

    closeSuggestions(): void {
        if (!this.suggestionsEnabled) {
            return;
        }

        this.abortController.abort();
        this.inputInFocus = false;
        this.dismissed = true;
        this.selectedIndex = -1;
        this.popularSearchTerms = [];
        this.searchTermPredictions = [];
    }

    dismissWhenClickingOutside(event: PointerEvent): void {
        if (!this.suggestionsEnabled || event.composedPath().includes(this)) {
            return;
        }

        this.dismissSuggestions();
    }

    private focusSearchInput(): void {
        this.renderRoot.querySelector<HTMLInputElement>('#search-input')?.focus();
    }

    private handleSearchTermInput(term: string): void {
        if (!this.suggestionsEnabled) {
            this.setSearchTerm(term);
            return;
        }

        this.abortController.abort();
        this.dismissed = false;
        this.selectedIndex = -1;
        this.searchTermPredictions = [];
        this.setSearchTerm(term);

        if (!term && this.inputInFocus) {
            void this.loadPopularSearchTerms();
        }
    }

    private handleInputFocus(inFocus: boolean): void {
        if (!this.suggestionsEnabled) {
            return;
        }

        this.inputInFocus = inFocus;

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
                this.handleEscape();
            }
            return;
        }

        const terms = this.visibleTerms;

        if (event.key === 'ArrowDown' && terms.length > 0) {
            event.preventDefault();
            this.selectedIndex = Math.min(this.selectedIndex + 1, terms.length - 1);
            return;
        }

        if (event.key === 'ArrowUp' && terms.length > 0) {
            event.preventDefault();
            this.selectedIndex = this.selectedIndex < 0
                ? terms.length - 1
                : Math.max(this.selectedIndex - 1, 0);
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            const selectedTerm = terms[this.selectedIndex];
            if (selectedTerm) {
                this.selectTerm(selectedTerm);
            } else {
                this.dismissSuggestions();
                this.submitSearchTerm();
            }
            return;
        }

        if (event.key !== 'Escape') {
            return;
        }

        event.preventDefault();
        if (terms.length > 0) {
            event.stopPropagation();
            this.dismissSuggestions();
        } else {
            this.handleEscape();
        }
    }

    private dismissSuggestions(): void {
        this.abortController.abort();
        this.dismissed = true;
        this.selectedIndex = -1;
    }

    private get listId(): string {
        return `${this.accessibilityId}-suggestions`;
    }

    private getOptionId(index: number): string {
        return `${this.listId}-option-${index}`;
    }

    private get activeDescendantId(): string | null {
        if (this.selectedIndex < 0 || !this.visibleTerms[this.selectedIndex]) {
            return null;
        }

        return this.getOptionId(this.selectedIndex);
    }

    private selectTerm(term: string): void {
        this.dismissSuggestions();
        this.setSearchTerm(term);
        this.submitSearchTerm();
    }

    private get visibleTerms(): string[] {
        if (!this.inputInFocus || this.dismissed) {
            return [];
        }

        return this.term ? this.searchTermPredictions : this.popularSearchTerms;
    }

    private async loadPopularSearchTerms(): Promise<void> {
        const options = this.suggestions?.popularSearchTerms;
        const take = options?.take ?? defaultTake;

        if (!options || take <= 0 || this.targetEntityTypes.length === 0 || !this.inputInFocus || this.term || this.dismissed) {
            return;
        }

        this.abortController.abort();
        const abortController = new AbortController();
        this.abortController = abortController;

        try {
            const settings = await getRelewiseContextSettings(this.displayedAtLocation ?? 'Relewise Search Combobox');
            if (abortController.signal.aborted || !this.inputInFocus || this.term || this.dismissed) {
                return;
            }

            const response = await getRecommender(getRelewiseUIOptions()).recommendPopularSearchTerms(buildPopularSearchTermsRequest({
                settings,
                take,
                targetEntityTypes: this.targetEntityTypes,
            }), { abortSignal: abortController.signal });

            if (!abortController.signal.aborted && this.inputInFocus && !this.term && !this.dismissed) {
                this.popularSearchTerms = response?.recommendations
                    ?.map(recommendation => recommendation.term)
                    .filter((term): term is string => term !== null && term !== undefined) ?? [];
            }
        } catch {
            if (!abortController.signal.aborted) {
                this.popularSearchTerms = [];
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
        const terms = this.visibleTerms;
        const expanded = terms.length > 0;
        const suggestionType = this.term ? 'predictions' : 'popular-search-terms';

        return html`
            <div class="rw-search-combobox">
                <div class="rw-search-bar rw-border" part="input">
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
                        <div class="rw-icon" @click=${() => this.handleSearchTermInput('')}>
                            <relewise-x-icon exportparts="icon"></relewise-x-icon>
                        </div>
                    ` : html`
                        <div class="rw-icon" @click=${() => this.focusSearchInput()}>
                            <relewise-search-icon exportparts="icon"></relewise-search-icon>
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
                            aria-label=${this.suggestionsLabel}>
                            ${terms.map((term, index) => html`
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
                                        @click=${() => this.selectTerm(term)}>
                                        ${term}
                                    </button>
                                </li>
                            `)}
                        </ul>
                    </div>
                ` : nothing}
            </div>
        `;
    }

    static styles = [
        theme,
        css`
            .rw-search-combobox {
                position: relative;
            }

            .rw-search-bar {
                box-sizing: border-box;
                display: flex;
                align-items: center;
                padding-left: 1em;
                padding-right: 1em;
                border-color: var(--relewise-search-bar-border-color, var(--color));
                height: var(--relewise-search-combobox-height, var(--relewise-product-search-bar-height, 3em));
            }

            .rw-search-bar:focus-within {
                border-color: var(--relewise-search-bar-border-color-focused, var(--accent-color));
                --relewise-icon-color: var(--accent-color);
                --relewise-x-icon-color: var(--accent-color);
            }

            .rw-search-bar-input {
                all: unset;
                max-width: calc(100% - 2em);
                min-width: calc(100% - 2em);
                height: 100%;
            }

            .rw-search-bar-input::placeholder {
                color: var(--color);
            }

            .rw-icon {
                width: 100%;
                height: 100%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .rw-search-suggestions {
                position: absolute;
                z-index: var(--relewise-search-suggestions-z-index, 999);
                top: calc(100% + var(--relewise-search-suggestions-offset, 0.25em));
                right: 0;
                left: 0;
                overflow: hidden;
                background: var(--relewise-search-suggestions-background-color, white);
                border: var(--border);
                border-color: var(--relewise-search-suggestions-border-color, #ddd);
                border-radius: var(--relewise-search-suggestions-border-radius, var(--border-radius));
                box-shadow: var(--relewise-search-suggestions-box-shadow, 0 10px 15px rgb(0 0 0 / 0.2));
            }

            .rw-search-suggestions-list {
                list-style: none;
                margin: 0;
                padding: 0;
            }

            .rw-search-suggestion {
                appearance: none;
                background: transparent;
                border: 0;
                color: inherit;
                cursor: pointer;
                display: block;
                font: inherit;
                padding: var(--relewise-search-suggestion-padding, 0.5em 1em);
                text-align: left;
                width: 100%;
            }

            .rw-search-suggestion:hover,
            .rw-search-suggestion[data-selected] {
                background: var(--relewise-hover-color, whitesmoke);
            }

            @media (max-width: 768px) {
                .rw-search-suggestions {
                    position: static;
                    margin-top: var(--relewise-search-suggestions-offset, 0.25em);
                }
            }
        `,
    ];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-search-combobox': SearchCombobox;
    }
}
