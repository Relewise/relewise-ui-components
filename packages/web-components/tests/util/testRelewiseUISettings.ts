import { UserFactory } from '@relewise/client';
import { RelewiseUISettings } from '../../src/initialize';

export function integrationTestRelewiseSettings(): RelewiseUISettings {
    const { INTEGRATION_TEST_DATASET_ID: datasetId, INTEGRATION_TEST_API_KEY: apiKey } = process.env;

    return {
        contextSettings: {
            getUser: () => {
                return UserFactory.anonymous();
            },
            language: 'en-US',
            currency: 'USD',   
            displayedAtLocation: 'Relewise UI Components',
        },
        selectedPropertiesSettings: {
            product: {
                displayName: true,
            },
        },
        datasetId: datasetId!,
        apiKey: apiKey!,
    }
}