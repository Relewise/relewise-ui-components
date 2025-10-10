import { assert } from '@esm-bundle/chai';
import { PersonalContentRecommendationBuilder } from '@relewise/client';
import { getRelewiseContextSettings, initializeRelewiseUI } from '../src';
import { getContentRecommendationBuilderWithDefaults } from '../src/builders/contentRecommendationBuilder';
import { defaultContentProperties } from '../src/defaultSettings';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('contentRecommendationBuilder', () => {
    const displayedAtLocation = 'web-components-tests';

    test('getContentRecommendationBuilderWithDefaults returns builder with defaults if no selectedPropertiesSettings provided', async() => {
        const mockedRelewiseOptions = mockRelewiseOptions();
        mockedRelewiseOptions.selectedPropertiesSettings = undefined!;
        initializeRelewiseUI(mockedRelewiseOptions);

        const expected = new PersonalContentRecommendationBuilder(getRelewiseContextSettings(displayedAtLocation))
            .setSelectedContentProperties(defaultContentProperties)
            .build();

        const result = (await getContentRecommendationBuilderWithDefaults<PersonalContentRecommendationBuilder>(
            options => new PersonalContentRecommendationBuilder(options),
            displayedAtLocation,
        )).build();

        assert.deepEqual(expected.settings.selectedContentProperties, result.settings.selectedContentProperties);
    });

    test('getContentRecommendationBuilderWithDefaults returns builder with options from initializeRelewiseUI', async() => {
        const mockedRelewiseOptions = mockRelewiseOptions();
        mockedRelewiseOptions.selectedPropertiesSettings = {
            ...mockedRelewiseOptions.selectedPropertiesSettings,
            content: {
                displayName: true,
                dataKeys: ['CustomKey'],
            },
        };
        initializeRelewiseUI(mockedRelewiseOptions);

        const expected = new PersonalContentRecommendationBuilder(getRelewiseContextSettings(displayedAtLocation))
            .setSelectedContentProperties(mockedRelewiseOptions.selectedPropertiesSettings!.content!)
            .build();

        const result = (await getContentRecommendationBuilderWithDefaults<PersonalContentRecommendationBuilder>(
            options => new PersonalContentRecommendationBuilder(options),
            displayedAtLocation,
        )).build();

        assert.deepEqual(expected.settings.selectedContentProperties, result.settings.selectedContentProperties);
    });
});
