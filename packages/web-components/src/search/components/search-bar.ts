import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { theme } from '../../theme';

export class SearchBar extends LitElement {

    @property()
    term: string = '';

    @property()
    setSearchTerm = (term: string) => { };

    @property()
    handleKeyEvent = (event: KeyboardEvent) => { };

    @property()
    setSearchBarInFocus = (inFocus: boolean) => { };

    @property()
    placeholder: string | null = null;

    @property({ type: Boolean, reflect: true })
    autofocus = false;

    connectedCallback(): void {
        super.connectedCallback();
    }

    firstUpdated() {
        if (this.autofocus) {
            this.focusSearchInput();
        }
    }

    focusSearchInput() {
        const searchInput = this.shadowRoot?.getElementById('search-input');
        if (searchInput) {
            searchInput.focus();
        }
    }

    render() {
        return html`
        <div class="rw-search-bar rw-border" part="input">
            <input
                id="search-input"
                autocomplete="off"
                class="rw-search-bar-input"
                type="text"
                placeholder=${this.placeholder ?? 'Search'}
                aria-label=${this.placeholder ?? 'Search'}
                .value=${this.term}
                @keydown=${this.handleKeyEvent}
                @input=${(e: InputEvent) => this.setSearchTerm((e.target as HTMLInputElement).value)}
                @focus=${() => this.setSearchBarInFocus(true)}
                @blur=${() => this.setSearchBarInFocus(false)}>
            ${this.term ?
                html`
                    <div class="rw-icon" @click=${() => this.setSearchTerm('')}>
                        <relewise-x-icon exportparts="icon"></relewise-x-icon>
                    </div>` : html`
                    <div class="rw-icon" @click=${() => this.focusSearchInput()}>
                        <relewise-search-icon exportparts="icon"></relewise-search-icon>
                    </div>
                `}
        </div>
        `;
    }

    static styles = [
        theme,
        css`
            .rw-search-bar {
                display: flex;
                align-items: center;
                padding-left: 1em;
                padding-right: 1em;
                border-color: var(--relewise-search-bar-border-color, var(--color));
                height: var(--relewise-product-search-bar-height, 3em);
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
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-search-bar': SearchBar;
    }
}