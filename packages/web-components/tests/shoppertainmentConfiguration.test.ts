import { assert } from '@esm-bundle/chai';
import {
    AdaptiveDiscoveryFeedConfiguration,
    getRelewiseAdaptiveDiscoveryTargetedConfigurations,
    getRelewiseUIAdaptiveDiscoveryOptions,
    getRelewiseUIShoppertainmentOptions,
    initializeRelewiseUI,
    registerAdaptiveDiscoveryTarget,
    useShoppertainment,
} from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('Shoppertainment configuration', () => {
    const createConfiguration = (minimumPageSize: number): AdaptiveDiscoveryFeedConfiguration => ({
        minimumPageSize,
        configure: () => undefined,
    });

    test('useShoppertainment stores Adaptive Discovery configuration without invoking it', () => {
        let configured = false;
        const configuration: AdaptiveDiscoveryFeedConfiguration = {
            minimumPageSize: 20,
            configurationKey: 'homepage',
            configure: () => configured = true,
        };

        initializeRelewiseUI(mockRelewiseOptions());
        useShoppertainment({ adaptiveDiscovery: configuration });

        assert.strictEqual(getRelewiseUIShoppertainmentOptions()?.adaptiveDiscovery, configuration);
        assert.strictEqual(getRelewiseUIAdaptiveDiscoveryOptions(), configuration);
        assert.isFalse(configured);
    });

    test('supports Shoppertainment without Adaptive Discovery configuration', () => {
        initializeRelewiseUI(mockRelewiseOptions()).useShoppertainment({});

        assert.deepEqual(getRelewiseUIShoppertainmentOptions(), {});
        assert.isUndefined(getRelewiseUIAdaptiveDiscoveryOptions());
    });

    test('supports fluent configuration and target registration', () => {
        const defaultConfiguration = createConfiguration(20);
        const targetConfiguration = createConfiguration(30);
        const app = initializeRelewiseUI(mockRelewiseOptions());

        const result = app
            .useShoppertainment({ adaptiveDiscovery: defaultConfiguration })
            .registerAdaptiveDiscoveryTarget('campaign', targetConfiguration);

        assert.strictEqual(result, app);
        assert.strictEqual(getRelewiseUIAdaptiveDiscoveryOptions(), defaultConfiguration);
        assert.strictEqual(
            getRelewiseAdaptiveDiscoveryTargetedConfigurations().resolve('campaign', defaultConfiguration),
            targetConfiguration,
        );
    });

    test('supports target registration during initialization', () => {
        const defaultConfiguration = createConfiguration(20);
        const targetConfiguration = createConfiguration(30);
        const options = mockRelewiseOptions();
        options.targets = {
            adaptiveDiscoveryTargets: builder => builder.add({
                target: 'campaign',
                configuration: targetConfiguration,
            }),
        };

        initializeRelewiseUI(options).useShoppertainment({ adaptiveDiscovery: defaultConfiguration });

        assert.strictEqual(
            getRelewiseAdaptiveDiscoveryTargetedConfigurations().resolve('campaign', defaultConfiguration),
            targetConfiguration,
        );
    });

    test('re-registering a target replaces its configuration', () => {
        const defaultConfiguration = createConfiguration(20);
        const firstConfiguration = createConfiguration(30);
        const replacementConfiguration = createConfiguration(40);

        initializeRelewiseUI(mockRelewiseOptions()).useShoppertainment({ adaptiveDiscovery: defaultConfiguration });
        registerAdaptiveDiscoveryTarget('campaign', firstConfiguration);
        registerAdaptiveDiscoveryTarget('campaign', replacementConfiguration);

        assert.strictEqual(
            getRelewiseAdaptiveDiscoveryTargetedConfigurations().resolve('campaign', defaultConfiguration),
            replacementConfiguration,
        );
    });

    test('an unknown target reports an error and falls back to the default configuration', () => {
        const defaultConfiguration = createConfiguration(20);
        const originalConsoleError = console.error;
        let error = '';
        console.error = message => error = String(message);

        try {
            initializeRelewiseUI(mockRelewiseOptions()).useShoppertainment({ adaptiveDiscovery: defaultConfiguration });

            const result = getRelewiseAdaptiveDiscoveryTargetedConfigurations().resolve('unknown', defaultConfiguration);

            assert.strictEqual(result, defaultConfiguration);
            assert.include(error, 'Could not find Adaptive Discovery configuration with target: \'unknown\'');
        } finally {
            console.error = originalConsoleError;
        }
    });
});
