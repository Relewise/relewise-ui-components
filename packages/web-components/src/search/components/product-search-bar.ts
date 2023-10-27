import { LitElement, css, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events, QueryKeys, getRelewiseUISearchOptions, readCurrentUrlState, updateUrlState } from '../../helpers';
import { theme } from '../../theme';

export class ProductSearchBar extends LitElement {

    @property({ type: Number, attribute: 'debounce-time' })
    debounceTime: number = 250;

    @state()
    term: string | null = null;

    private debounceTimeoutHandlerId: ReturnType<typeof setTimeout> | null = null;

    connectedCallback(): void {
        super.connectedCallback();
        this.term = readCurrentUrlState(QueryKeys.term) ?? null;
    }

    handleKeyDown(event: KeyboardEvent): void {
        switch (event.key) {
        case 'Enter':
            event.preventDefault();
            window.dispatchEvent(new CustomEvent(Events.search));
            break;
        }
    }

    setSearchTerm(term: string) {
        this.term = term;
        updateUrlState(QueryKeys.term, term);

        if (this.debounceTimeoutHandlerId) {
            clearTimeout(this.debounceTimeoutHandlerId);
        }

        this.debounceTimeoutHandlerId = setTimeout(() => {
            window.dispatchEvent(new CustomEvent(Events.search));
        }, this.debounceTime);
    }

    render() {
        const localization = getRelewiseUISearchOptions().localization?.searchBar;
        return html`
        <relewise-search-bar 
            .term=${this.term ?? ''}
            .setSearchTerm=${(term: string)=> this.setSearchTerm(term)}
            .handleKeyEvent=${(e: KeyboardEvent) => this.handleKeyDown(e)}
            .placeholder=${localization?.placeholder ?? 'Search'}
            class="rw-search-bar">
        </relewise-search-bar>
        <relewise-button
            class="rw-button"
            button-text=${localization?.searchButton ?? 'Search'}
            .handleClick=${() => window.dispatchEvent(new CustomEvent(Events.search))}>
            <relewise-search-icon></relewise-search-icon>
        </relewise-button>
        `;
    }

    static styles = [
        theme,
        css`
            :host {
                display: flex;
                margin-top: 1rem;
                margin-bottom: 1rem;
            }

            .rw-search-bar {
                width: 100%;
                margin-right: .5rem;
                --color: var(--accent-color);
            }
        `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-search-bar': ProductSearchBar;
    }
}