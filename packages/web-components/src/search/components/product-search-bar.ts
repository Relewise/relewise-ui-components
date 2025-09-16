import { LitElement, css, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Events, QueryKeys, clearUrlState, getRelewiseUISearchOptions, readCurrentUrlState, updateUrlState } from '../../helpers';
import { theme } from '../../theme';

export class ProductSearchBar extends LitElement {
    @property({ type: Boolean, reflect: true })
    autofocus = false;

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
                if (this.debounceTimeoutHandlerId) {
                    clearTimeout(this.debounceTimeoutHandlerId);
                }

                this.setSearchTerm((event.target as HTMLInputElement).value);
                break;
        }
    }

    debouncedSetSearchTerm(term: string) {
        if (this.debounceTimeoutHandlerId) {
            clearTimeout(this.debounceTimeoutHandlerId);
        }

        this.debounceTimeoutHandlerId = setTimeout(() => {
            this.setSearchTerm(term);
        }, getRelewiseUISearchOptions()?.debounceTimeInMs);
    }

    setSearchTerm(term: string) {
        if (this.term === term) {
            return;
        }
        this.term = term;

        clearUrlState();
        updateUrlState(QueryKeys.term, term);

        window.dispatchEvent(new CustomEvent(Events.search));
    }

    render() {
        const localization = getRelewiseUISearchOptions()?.localization?.searchBar;
        return html`
        <relewise-search-bar 
            .term=${this.term ?? ''}
            .setSearchTerm=${(term: string) => this.debouncedSetSearchTerm(term)}
            .handleKeyEvent=${(e: KeyboardEvent) => this.handleKeyDown(e)}
            .placeholder=${localization?.placeholder ?? 'Search'}
            .autofocus="${this.autofocus}"
            class="rw-search-bar">
        </relewise-search-bar>
        <relewise-button
            button-text=${localization?.search ?? 'Search'}
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
            }

            relewise-button {
                --button-color: var(--accent-color);
                --relewise-button-text-color: var(--color);
                height: 3rem;
            }

            .rw-search-bar {
                width: var(--relewise-product-search-bar-width, 100%);
                margin-right: var(--relewise-product-search-margin-right, .5rem);
                --color: var(--accent-color);
            }
        `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-product-search-bar': ProductSearchBar;
    }
}