class RelewiseSearchBox extends HTMLElement {
    _searchInput = document.createElement('input');

    constructor() {
        super();

        const button = document.createElement('button');
        button.addEventListener("click", () => { button.style.backgroundColor = "red"; });
        button.textContent = "search";

        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.appendChild(this._searchInput);
        shadowRoot.appendChild(button);
        shadowRoot.appendChild(document.createElement('relewise-ui-results'));

        this._searchInput.addEventListener('keydown', () => {
            shadowRoot.querySelector('relewise-ui-results').setAttribute('color', Math.floor(Math.random() * 16777215).toString(16))
        });
    }

    static get observedAttributes() { return ['placeholder']; }

    attributeChangedCallback(attr, oldVal, newVal) {
        if (oldVal === newVal) return; // nothing to do
        
        switch (attr) {
            case 'placeholder':
                this._searchInput.placeholder = newVal || 'Search';
                break;
        }
    }

    connectedCallback() {
        if (!this.getAttribute('placeholder')) { this.setAttribute('placeholder', 'Search'); }
    }
}

class RelewiseResults extends HTMLElement {
    constructor() {
        super();

        const container = document.createElement("div");
        container.id = "relewise-results";
        container.textContent = "Hej"
        const style = document.createElement('style');
        style.textContent = `
          div { padding: 10px; border: 1px solid gray; height: 200px; margin-top: 10px; }
        `;

        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.appendChild(style);
        shadowRoot.appendChild(container);

    }

    static get observedAttributes() { return ['color']; }

    attributeChangedCallback(attr, oldVal, newVal) {
        if (oldVal === newVal) return; // nothing to do

        switch (attr) {
            case 'color':
                this.shadowRoot.lastChild.style.backgroundColor = newVal;
                break;
        }
    }
}

function registerUI(
    { datasetId, apiKey, settings, builder, }
) {
    const relewiseSettings = {
        settings,
        datasetId,
        apiKey,

    };

    window.RelewiseUISettngs = relewiseSettings;

    customElements.define('relewise-ui-search-box', RelewiseSearchBox);
    customElements.define('relewise-ui-results', RelewiseResults);
};

const getUser = () => { return null; };

registerUI({
    datasetId: 'dataset-id',
    apiKey: 'api-key',
    settings: () => ({
        language: 'da',
        currency: 'DKK',
        user: getUser(),
        displayedAtLocation: ''
    }),
    builder: (p) => { return p; }
});

