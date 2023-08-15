class RelewiseSearchBox extends HTMLElement {
    _searcher = new Relewise.Searcher(window.RelewiseUISettings.datasetId, window.RelewiseUISettings.apiKey, { serverUrl: 'https://sandbox-api.relewise.com/' });
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

        this._searchInput.addEventListener('keyup', async () => {
            const resultsContainer = shadowRoot.querySelector('relewise-ui-results');
            resultsContainer.setAttribute('color', Math.floor(Math.random() * 16777215).toString(16));

            const builder = new Relewise.ProductSearchBuilder(window.RelewiseUISettings.settings()).setTerm(this._searchInput.value);

            window.RelewiseUISettings.builder(builder);

            const response = await this._searcher.searchProducts(builder.build());

            resultsContainer.setAttribute("items", JSON.stringify(response.results));
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
        container.textContent = "Type in the search field to show products";
        const style = document.createElement('style');
        style.textContent = `
          #relewise-results { padding: 10px; border: 1px solid gray; margin-top: 10px; display: grid;
            grid-template-columns: repeat(4, 1fr);
            grid-column-gap: 10px;
            grid-row-gap: 10px; }
         #relewise-results relewise-ui-product-item { border: 1px solid #ddd; background-color: white; padding: 10px; }
        `;

        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.appendChild(style);
        shadowRoot.appendChild(container);
    }

    static get observedAttributes() { return ['color', "items"]; }

    attributeChangedCallback(attr, oldVal, newVal) {
        if (oldVal === newVal) return; // nothing to do

        switch (attr) {
            case 'color':
                this.shadowRoot.lastChild.style.backgroundColor = newVal;
                break;
            case 'items':
                const items = JSON.parse(newVal);
                this.shadowRoot.lastChild.textContent = null;
                for (const item of items) {
                    const el = document.createElement("relewise-ui-product-item");
                    el.setAttribute('item', JSON.stringify(item));
                    this.shadowRoot.lastChild.appendChild(el);
                }
                break;
        }
    }
}

class RelewiseProductItem extends HTMLElement {
    constructor() {
        super();

        const container = document.createElement("div");
        container.classList.add("item");

        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.appendChild(container);
    }

    static get observedAttributes() { return ["item"]; }

    attributeChangedCallback(attr, oldVal, newVal) {
        if (oldVal === newVal) return; // nothing to do

        const template = (item) => `<slot><h3 style='margin-top: 0;'>${item.displayName}</h3><span>${item.productId}</span>{{item.productId}}</slot>`; 

        switch (attr) {

            case 'item':
                const item = JSON.parse(newVal);
                var parser = new DOMParser();
                var doc = parser.parseFromString(template(item), 'text/html');
                this.shadowRoot.lastChild.appendChild(doc.body.firstChild);
                break;
        }
    }

    
}

function registerUI(
    { datasetId, apiKey, settings, builder, serverUrl }
) {
    const relewiseSettings = {
        settings,
        datasetId,
        serverUrl,
        apiKey,
        builder
    };

    window.RelewiseUISettings = relewiseSettings;

    if (customElements.get('relewise-ui-search-box') === undefined) {
        customElements.define('relewise-ui-search-box', RelewiseSearchBox);
    }
    
    customElements.define('relewise-ui-results', RelewiseResults);
    customElements.define('relewise-ui-product-item', RelewiseProductItem);
};

const getUser = () => { console.log('getting user'); return null; };

registerUI({
    datasetId: '',
    apiKey: '',
    serverUrl: '',
    settings: () => ({
        language: 'da-dk',
        currency: 'DKK',
        user: getUser(),
        displayedAtLocation: ''
    }),
    builder: (p) => { p.setSelectedProductProperties({ displayName: true }); }
});

