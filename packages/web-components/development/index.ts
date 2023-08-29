import { registerRelewiseUI } from '../src/index';

registerRelewiseUI(
    {
        contextSettings: {
            getUser: (userFactory: any) => {
                return userFactory.anonymous();
            },
            language: 'da-dk',
            currency: 'DKK',
            displayedAtLocation: 'Relewise Demo Store',
        },
        datasetId: '',
        apiKey: '',
        selectedPropertiesSettings: {
            product: {
                displayName: true,
            },
        },
        clientOptions: {
            serverUrl: 'https://api.relewise.com/',
        },
    },
);