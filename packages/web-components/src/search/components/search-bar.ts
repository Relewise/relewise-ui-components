import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { theme } from '../../theme';

export class SearchBar extends LitElement {

    @property()
    term: string = '';

    @property()
    setSearchTerm = (term: string) => {};

    @property()
    handleKeyEvent = (event: KeyboardEvent) => {};

    @property()
    setSearchBarInFocus = (inFocus: boolean) => {};

    @property()
    placeholder: string | null = null;

    connectedCallback(): void {
        super.connectedCallback();
    }

    focusSearchInput() {
        const searchInput = this.shadowRoot?.getElementById('search-input');
        if (searchInput) {
            searchInput.focus();
        }
    }

    render() {
        return html`
        <div class="rw-search-bar rw-border" @keydown=${this.handleKeyEvent}>
            <input 
                id="search-input"
                class="rw-search-bar-input"
                type="text"
                placeholder=${this.placeholder ?? 'Search'}
                .value=${this.term}
                @input=${(e: InputEvent) => this.setSearchTerm((e.target as HTMLInputElement).value)}
                @focus=${() => this.setSearchBarInFocus(true)} 
                @blur=${() => this.setSearchBarInFocus(false)}>
            ${this.term ? 
                html`
                    <div class="rw-icon" @click=${() => this.setSearchTerm('')}>
                        <relewise-x-icon></relewise-x-icon>
                    </div>` : html`
                    <div class="rw-icon" @click=${() => this.focusSearchInput()}>
                        <relewise-search-icon></relewise-search-icon>
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
                padding-left: 1rem;
                padding-right: 1rem;
                border-color: var(--color);
                height: var(--relewise-product-search-overlay-search-bar-height, 3rem);
            }

            .rw-search-bar:focus-within {
                border-color: var(--accent-color);
                --relewise-icon-color: var(--accent-color);
                --relewise-x-icon-color: var(--accent-color);
            }

            .rw-search-bar-input {
                all: unset;
                max-width: calc(100% - 2rem); 
                min-width: calc(100% - 2rem);
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