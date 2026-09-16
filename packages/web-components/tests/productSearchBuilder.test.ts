import { assert } from '@esm-bundle/chai';
import { Settings, UserFactory } from '@relewise/client';
import { createProductSearchBuilder, initializeRelewiseUI } from '../src';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('productSearchBuilder', () => {
    const settings: Settings = {
        currency: 'DKK',
        displayedAtLocation: 'web-components-tests',
        language: 'da-dk',
        user: UserFactory.anonymous(),
    };

    test('uses the default variant request settings', () => {
        initializeRelewiseUI(mockRelewiseOptions()).useSearch();

        const request = createProductSearchBuilder(null, settings).build();

        assert.equal(request.settings?.variantRequestSettings?.maxVariantsPerProduct, 1);
        assert.notProperty(request.settings ?? {}, 'explodedVariants');
    });

    test('uses configured variant request settings', () => {
        initializeRelewiseUI(mockRelewiseOptions()).useSearch({
            variantRequestSettings: builder => builder
                .setMaxVariantsPerProduct(3)
                .setSorting('ByRelevance'),
        });

        const request = createProductSearchBuilder('shoe', settings).build();

        assert.equal(request.settings?.variantRequestSettings?.maxVariantsPerProduct, 3);
        assert.equal(request.settings?.variantRequestSettings?.sorting, 'ByRelevance');
    });

    test('maps the deprecated explodedVariants option to variant request settings', () => {
        initializeRelewiseUI(mockRelewiseOptions()).useSearch({ explodedVariants: 2 });

        const request = createProductSearchBuilder(null, settings).build();

        assert.equal(request.settings?.variantRequestSettings?.maxVariantsPerProduct, 2);
        assert.notProperty(request.settings ?? {}, 'explodedVariants');
    });

    test('variant request settings take precedence over explodedVariants', () => {
        initializeRelewiseUI(mockRelewiseOptions()).useSearch({
            explodedVariants: 4,
            variantRequestSettings: builder => builder.setMaxVariantsPerProduct(2),
        });

        const request = createProductSearchBuilder(null, settings).build();

        assert.equal(request.settings?.variantRequestSettings?.maxVariantsPerProduct, 2);
    });
});
