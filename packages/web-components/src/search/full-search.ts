import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { QueryKeys, getRelewiseUISearchOptions, readCurrentUrlState, updateUrlState } from '../helpers';
import { theme } from '../theme';

export class FullSearch extends LitElement {

    @property({ attribute: 'displayed-at-location' })
    displayedAtLocation?: string = undefined;

    @property({ type: Boolean, reflect: true, attribute: 'open' })
    isOpen = false;

    @state()
    term: string = '';

    private debounceTimeoutHandlerId: ReturnType<typeof setTimeout> | null = null;
    private handleWindowKeyDownBound = this.handleWindowKeyDown.bind(this);

    connectedCallback(): void {
        super.connectedCallback();
        this.term = readCurrentUrlState(QueryKeys.term) ?? '';
        window.addEventListener('keydown', this.handleWindowKeyDownBound);
    }

    disconnectedCallback(): void {
        window.removeEventListener('keydown', this.handleWindowKeyDownBound);
        super.disconnectedCallback();
    }

    open(): void {
        this.isOpen = true;
    }

    close(): void {
        this.isOpen = false;
    }

    setSearchTerm(term: string): void {
        this.term = term;

        if (this.debounceTimeoutHandlerId) {
            clearTimeout(this.debounceTimeoutHandlerId);
        }

        this.debounceTimeoutHandlerId = setTimeout(() => {
            updateUrlState(QueryKeys.term, this.term);
        }, getRelewiseUISearchOptions()?.debounceTimeInMs);
    }

    handleKeyEvent(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            event.preventDefault();
            this.close();
        }
    }

    handleWindowKeyDown(event: KeyboardEvent): void {
        if (!this.isOpen || event.key !== 'Escape') {
            return;
        }

        event.preventDefault();
        this.close();
    }

    handleBackdropClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.close();
        }
    }

    render() {
        if (!this.isOpen) {
            return nothing;
        }

        const localization = getRelewiseUISearchOptions()?.localization?.searchBar;

        return html`
            <div class="rw-backdrop" part="backdrop" @click=${this.handleBackdropClick}>
                <section
                    class="rw-dialog"
                    part="dialog"
                    role="dialog"
                    aria-modal="true"
                    aria-label=${localization?.search ?? 'Search'}>
                    <header class="rw-header" part="header">
                        <relewise-search-bar
                            part="search-bar"
                            exportparts="input: search-input, icon: search-icon"
                            .term=${this.term}
                            .setSearchTerm=${(term: string) => this.setSearchTerm(term)}
                            .handleKeyEvent=${(event: KeyboardEvent) => this.handleKeyEvent(event)}
                            .placeholder=${localization?.placeholder ?? null}
                            autofocus>
                        </relewise-search-bar>
                        <relewise-button
                            class="rw-close"
                            part="close-button"
                            button-text="Close"
                            @click=${this.close}>
                            <relewise-x-icon></relewise-x-icon>
                        </relewise-button>
                    </header>
                    <div class="rw-content" part="content">
                        <slot>
                            <p class="rw-empty" part="empty-state">Start typing to search.</p>
                        </slot>
                    </div>
                </section>
            </div>
        `;
    }

    static styles = [theme, css`
        :host {
            font-family: var(--font);
        }

        .rw-backdrop {
            position: fixed;
            inset: 0;
            z-index: var(--relewise-full-search-z-index, 1000);
            background: var(--relewise-full-search-backdrop-background, rgb(0 0 0 / 0.35));
            display: flex;
            justify-content: center;
            align-items: stretch;
        }

        .rw-dialog {
            background: var(--relewise-full-search-background, white);
            color: var(--relewise-full-search-color, var(--color));
            width: var(--relewise-full-search-width, 100%);
            height: var(--relewise-full-search-height, 100%);
            display: flex;
            flex-direction: column;
        }

        .rw-header {
            display: flex;
            gap: var(--relewise-full-search-header-gap, 1em);
            align-items: center;
            padding: var(--relewise-full-search-header-padding, 1em);
            border-bottom: 1px solid var(--relewise-full-search-border-color, #ddd);
        }

        relewise-search-bar {
            flex: 1;
        }

        .rw-close {
            flex: 0 0 auto;
        }

        .rw-content {
            flex: 1;
            overflow: auto;
            padding: var(--relewise-full-search-content-padding, 1em);
        }

        .rw-empty {
            margin: 0;
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-full-search': FullSearch;
    }
}
