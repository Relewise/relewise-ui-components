import { UserFactory } from '@relewise/client';
import { RelewiseUIOptions } from '../../src/initialize';

export function mockRelewiseOptions(): RelewiseUIOptions {
    return {
        contextSettings: {
            getUser: () => {
                return UserFactory.anonymous();
            },
            language: 'language',
            currency: 'currency',   
            displayedAtLocation: 'displayedAtLocation',
        },
        clientOptions: {
            serverUrl: 'server url',
        },
        selectedPropertiesSettings: {
            product: {
                displayName: true,
            },
        },
        datasetId: 'datasetId',
        apiKey: 'apiKey',
    }
}