import { RelewiseLitElement } from '../../relewise-lit-element';
import { css, html, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { theme } from '../../theme';

export class SearchBar extends RelewiseLitElement {

    @property()
    term: string = '';

    @property()
    setSearchTerm = (term: string) => { };

    @property()
    handleKeyEvent = (event: KeyboardEvent) => { };

    @property()
    setSearchBarInFocus = (inFocus: boolean) => { };

    @property({ attribute: false })
    inputAssist: TemplateResult | typeof nothing = nothing;

    @property({ type: Boolean, attribute: false })
    inputAssistEnabled = false;

    @property({ type: Boolean, attribute: false })
    inputAssistExpanded = false;

    @property({ attribute: false })
    inputAssistListId: string | null = null;

    @property({ attribute: false })
    inputAssistActiveDescendantId: string | null = null;

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
        const searchInput = this.renderRoot.querySelector<HTMLInputElement>('#search-input');
        if (searchInput) {
            searchInput.focus();
        }
    }

    render() {
        return html`
        <div class="rw-search-container">
            <div class="rw-search-bar rw-border" part="input">
                <input
                    id="search-input"
                    autocomplete="off"
                    class="rw-search-bar-input"
                    type="text"
                    role=${this.inputAssistEnabled ? 'combobox' : nothing}
                    aria-autocomplete=${this.inputAssistEnabled ? 'list' : nothing}
                    aria-expanded=${this.inputAssistEnabled ? String(this.inputAssistExpanded) : nothing}
                    aria-controls=${this.inputAssistExpanded ? this.inputAssistListId ?? nothing : nothing}
                    aria-activedescendant=${this.inputAssistExpanded ? this.inputAssistActiveDescendantId ?? nothing : nothing}
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
            ${this.inputAssist}
        </div>
        `;
    }

    static styles = [
        theme,
        css`
            .rw-search-container {
                position: relative;
            }

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

            .rw-input-assist {
                position: absolute;
                z-index: var(--relewise-universal-search-input-assist-z-index, 1);
                top: calc(100% + var(--relewise-universal-search-input-assist-offset, 0.25em));
                right: 0;
                left: 0;
                background: var(--relewise-universal-search-input-assist-background, white);
                border: 1px solid var(--relewise-universal-search-border-color, #ddd);
                box-shadow: var(--relewise-universal-search-input-assist-box-shadow, 0 0.5em 1em rgb(0 0 0 / 0.12));
            }

            .rw-input-assist-list {
                list-style: none;
                margin: 0;
                padding: var(--relewise-universal-search-input-assist-padding, 0.5em 0);
            }

            .rw-input-assist-item {
                appearance: none;
                background: transparent;
                border: 0;
                color: inherit;
                cursor: pointer;
                display: block;
                font: inherit;
                padding: var(--relewise-universal-search-input-assist-item-padding, 0.625em 1em);
                text-align: left;
                width: 100%;
            }

            .rw-input-assist-item:hover,
            .rw-input-assist-item[data-selected] {
                background: var(--relewise-universal-search-input-assist-item-active-background, #f2f2f2);
            }

            @media (max-width: 768px) {
                .rw-input-assist {
                    position: static;
                    margin-top: var(--relewise-universal-search-input-assist-offset, 0.25em);
                }
            }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-search-bar': SearchBar;
    }
}
