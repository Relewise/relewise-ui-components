import { css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { QueryKeys, getRelewiseUISearchOptions, readCurrentUrlState, updateUrlState } from '../helpers';
import { RelewiseLitElement } from '../relewise-lit-element';
import { theme } from '../theme';

export class UniversalSearch extends RelewiseLitElement {

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

    closeWhenClickingOutsideDialog(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.close();
        }
    }

    render() {
        if (!this.isOpen) {
            return nothing;
        }

        const localization = getRelewiseUISearchOptions()?.localization;
        const searchBarLocalization = localization?.searchBar;
        const universalSearchLocalization = localization?.universalSearch;

        return html`
            <div class="rw-backdrop" part="backdrop" @click=${this.closeWhenClickingOutsideDialog}>
                <section
                    class="rw-dialog"
                    part="dialog"
                    role="dialog"
                    aria-modal="true"
                    aria-label=${searchBarLocalization?.search ?? 'Search'}>
                    <header class="rw-header" part="header">
                        <relewise-search-bar
                            part="search-bar"
                            exportparts="input: search-input, icon: search-icon"
                            .term=${this.term}
                            .setSearchTerm=${(term: string) => this.setSearchTerm(term)}
                            .handleKeyEvent=${(event: KeyboardEvent) => this.handleKeyEvent(event)}
                            .placeholder=${searchBarLocalization?.placeholder ?? null}
                            autofocus>
                        </relewise-search-bar>
                        <relewise-button
                            class="rw-close"
                            part="close-button"
                            button-text=${universalSearchLocalization?.close ?? 'Close'}
                            @click=${this.close}>
                        </relewise-button>
                    </header>
                    <div class="rw-content" part="content">
                        <slot>
                            <p class="rw-empty" part="empty-state">${universalSearchLocalization?.emptyState ?? 'Start typing to search.'}</p>
                        </slot>
                    </div>
                </section>
            </div>
        `;
    }

    static styles = [theme, css`
        :host {
            font-family: var(--font);
            --relewise-universal-search-color: var(--relewise-color, #212427);
        }

        .rw-backdrop {
            position: fixed;
            inset: 0;
            z-index: var(--relewise-universal-search-z-index, 1000);
            background: var(--relewise-universal-search-backdrop-background, rgb(0 0 0 / 0.35));
            display: flex;
            justify-content: center;
            align-items: stretch;
        }

        .rw-dialog {
            background: var(--relewise-universal-search-background, white);
            color: var(--relewise-universal-search-color);
            --color: var(--relewise-universal-search-color);
            width: var(--relewise-universal-search-width, 100%);
            height: var(--relewise-universal-search-height, 100%);
            display: flex;
            flex-direction: column;
        }

        .rw-header {
            display: flex;
            gap: var(--relewise-universal-search-header-gap, 1em);
            align-items: center;
            padding: var(--relewise-universal-search-header-padding, 1em);
            border-bottom: 1px solid var(--relewise-universal-search-border-color, #ddd);
        }

        relewise-search-bar {
            flex: 1;
        }

        .rw-close {
            flex: 0 0 auto;
            height: var(--relewise-product-search-bar-height, 3em);
            margin: 0;
            padding: var(--relewise-universal-search-close-button-padding, 0 0.75em);
            --relewise-button-icon-padding: 0;
            --relewise-button-text-color: var(--relewise-universal-search-color);
        }

        .rw-content {
            flex: 1;
            overflow: auto;
            padding: var(--relewise-universal-search-content-padding, 1em);
        }

        .rw-empty {
            margin: 0;
        }
    `];
}

declare global {
    interface HTMLElementTagNameMap {
        'relewise-universal-search': UniversalSearch;
    }
}
