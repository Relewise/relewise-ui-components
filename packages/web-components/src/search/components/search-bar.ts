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

    render() {
        return html`
        <div class="rw-search-bar rw-border" @keydown=${this.handleKeyEvent}>
            <input 
                class="rw-search-bar-input"
                type="text"
                placeholder=${this.placeholder ?? 'Search'}
                .value=${this.term}
                @input=${(e: InputEvent) => this.setSearchTerm((e.target as HTMLInputElement).value)}
                @focus=${() => this.setSearchBarInFocus(true)} 
                @blur=${() => this.setSearchBarInFocus(false)}>
            ${this.term ? html`<div class="rw-clear" @click=${() => this.setSearchTerm('')}><relewise-x-icon></relewise-x-icon></div>`  : html`<div class="rw-search-icon"><relewise-search-icon></relewise-search-icon></div>`}
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
            }

            .rw-search-bar-input::placeholder {
                color: var(--color);
            }

            .rw-clear {
                cursor: pointer;
                margin: auto;
            }

            .rw-search-icon {
                margin: auto;
            }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-search-bar': SearchBar;
    }
}