class RelewiseSearchBox extends HTMLElement {
    constructor() {
        super();

        const input = document.createElement('input');
        const button = document.createElement('button');
        button.textContent = "search"

        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.appendChild(input)
        shadowRoot.appendChild(button);
    }
}

function registerUI(
    { datasetId, apiKey, settings, builder,  }
) {
    const relewiseSettings = {
        settings,
        datasetId,
        apiKey,
        
    };

    window.RelewiseUISettngs = relewiseSettings;

    customElements.define('relewise-ui-search-box', RelewiseSearchBox);
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

