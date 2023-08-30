import { UserFactory } from '@relewise/client';
import { RelewiseUISettings } from '../../src/relewiseUI';

export function mockRelewiseSettings(): RelewiseUISettings {
    return {
        contextSettings: {
            getUser: () => {
                return UserFactory.anonymous();
            },
            language: '',
            currency: '',   
            displayedAtLocation: '',
        },
        datasetId: '',
        apiKey: '',
    }
}