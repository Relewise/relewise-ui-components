import { assert, fixture, html, waitUntil } from '@open-wc/testing';
import { Tracker, type ProductResult, type RetailMediaResult, type RetailMediaResultPlacementResultEntity } from '@relewise/client';
import { nothing } from 'lit';
import { initializeRelewiseUI, useRetailMedia, useSearch } from '../src';
import { RetailMediaTargetBuilder, type RetailMediaTargetConfiguration } from '../src/builders/retailMediaBuilder';
import { getProductSearchRenderItems, getProductSearchRenderItemsForPages } from '../src/search/retailMediaRendering';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

function product(productId: string): ProductResult {
    return { productId, rank: 1 } as ProductResult;
}

function promotedProduct(productId: string): RetailMediaResultPlacementResultEntity {
    return { promotedProduct: { result: product(productId) } };
}

function displayAd(displayAdId: string): RetailMediaResultPlacementResultEntity {
    return {
        promotedDisplayAd: {
            campaignId: `campaign-${displayAdId}`,
            result: { displayAdId, name: `Display ad ${displayAdId}` },
        },
    };
}

suite('retail media rendering', () => {
    test('merges configured placements and organic products in display order', () => {
        initializeRelewiseUI(mockRelewiseOptions());
        useRetailMedia(builder => builder.templates({
            retailMediaDisplayAd: (ad, { html }) => html`<span>${ad.result.name}</span>`,
        }));

        const configuration: RetailMediaTargetConfiguration = {
            locationKey: 'Search Results',
            placements: [
                { key: 'Before', position: { type: 'beforeResults' } },
                { key: 'Inline', position: { type: 'atPosition', position: 2 } },
                { key: 'Overflow', position: { type: 'atPosition', position: 20 } },
                { key: 'After', position: { type: 'afterResults' } },
            ],
        };
        const retailMedia: RetailMediaResult = {
            placements: {
                Before: { results: [displayAd('before')] },
                Inline: { results: [promotedProduct('sponsored-inline'), displayAd('inline')] },
                Overflow: { results: [promotedProduct('sponsored-overflow')] },
                After: { results: [displayAd('after')] },
                Unconfigured: { results: [promotedProduct('ignored')] },
            },
        };

        const items = getProductSearchRenderItems(
            [product('1'), product('2'), product('3')],
            retailMedia,
            configuration,
        );

        assert.deepEqual(items.map(item => item.type === 'product'
            ? `product:${item.product.productId}`
            : item.entity.promotedProduct
                ? `sponsored:${item.entity.promotedProduct.result.productId}`
                : `display:${item.entity.promotedDisplayAd?.result.displayAdId}`), [
            'display:before',
            'product:1',
            'sponsored:sponsored-inline',
            'display:inline',
            'product:2',
            'product:3',
            'sponsored:sponsored-overflow',
            'display:after',
        ]);
    });

    test('keeps each response placements relative to that response products', () => {
        initializeRelewiseUI(mockRelewiseOptions());
        const configuration: RetailMediaTargetConfiguration = {
            locationKey: 'Search Results',
            placements: [
                { key: 'Hero', position: { type: 'beforeResults' } },
                { key: 'Inline', position: { type: 'atPosition', position: 2 } },
            ],
        };

        const items = getProductSearchRenderItemsForPages([
            {
                products: [product('1'), product('2')],
                retailMedia: {
                    placements: {
                        Hero: { results: [promotedProduct('hero-1')] },
                        Inline: { results: [promotedProduct('inline-1')] },
                    },
                },
                retailMediaTargetConfiguration: configuration,
            },
            {
                products: [product('3'), product('4')],
                retailMedia: {
                    placements: {
                        Hero: { results: [promotedProduct('hero-2')] },
                        Inline: { results: [promotedProduct('inline-2')] },
                    },
                },
                retailMediaTargetConfiguration: configuration,
            },
        ]);

        assert.deepEqual(items.map(item => item.type === 'product'
            ? `product:${item.product.productId}`
            : `sponsored:${item.entity.promotedProduct?.result.productId}`), [
            'sponsored:hero-1',
            'product:1',
            'sponsored:inline-1',
            'product:2',
            'sponsored:hero-2',
            'product:3',
            'sponsored:inline-2',
            'product:4',
        ]);
    });

    test('renders duplicate placement keys only once', () => {
        initializeRelewiseUI(mockRelewiseOptions());
        const configuration = new RetailMediaTargetBuilder()
            .location('Search Results')
            .placement('Hero', placement => placement.beforeResults())
            .placement('Hero', placement => placement.afterResults())
            .build();
        const retailMedia: RetailMediaResult = {
            placements: {
                Hero: { results: [promotedProduct('hero')] },
            },
        };

        const items = getProductSearchRenderItems([product('1')], retailMedia, configuration);

        assert.deepEqual(items.map(item => item.type === 'product'
            ? `product:${item.product.productId}`
            : `sponsored:${item.entity.promotedProduct?.result.productId}`), [
            'sponsored:hero',
            'product:1',
        ]);
    });

    test('skips display ads without a template before resolving the empty state', () => {
        initializeRelewiseUI(mockRelewiseOptions());
        useRetailMedia(builder => builder.variation({ key: 'Default', minWidth: 0 }));
        const entity = displayAd('unrenderable');
        const configuration: RetailMediaTargetConfiguration = {
            locationKey: 'Search Results',
            placements: [{ key: 'Hero', position: { type: 'beforeResults' } }],
        };
        const retailMedia: RetailMediaResult = {
            placements: {
                Hero: { results: [entity] },
            },
        };

        assert.deepEqual(getProductSearchRenderItems([], retailMedia, configuration), []);
    });

    test('renders promoted products with the default sponsored label', async() => {
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch();
        useRetailMedia(builder => builder.variation({ key: 'Default', minWidth: 0 }));

        const element = await fixture<HTMLElement & { entity: RetailMediaResultPlacementResultEntity }>(html`
            <relewise-retail-media-tile
                .entity=${promotedProduct('sponsored')}>
            </relewise-retail-media-tile>
        `);

        assert.equal(element.shadowRoot?.querySelector('[part="sponsored-label"]')?.textContent?.trim(), 'Sponsored');
        assert.equal(
            (element.shadowRoot?.querySelector('relewise-product-tile') as HTMLElement & { product: ProductResult }).product.productId,
            'sponsored',
        );
    });

    test('omits the sponsored-label wrapper when its template returns nothing', async() => {
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch();
        useRetailMedia(builder => builder.templates({
            retailMediaSponsoredLabel: () => nothing,
        }));

        const element = await fixture<HTMLElement & { entity: RetailMediaResultPlacementResultEntity }>(html`
            <relewise-retail-media-tile
                .entity=${promotedProduct('unlabelled')}>
            </relewise-retail-media-tile>
        `);

        assert.exists(element.shadowRoot?.querySelector('relewise-product-tile'));
        assert.isNull(element.shadowRoot?.querySelector('[part="sponsored-label"]'));
    });

    test('omits the sponsored-label wrapper when its asynchronous template resolves to nothing', async() => {
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch();
        useRetailMedia(builder => builder.templates({
            retailMediaSponsoredLabel: () => Promise.resolve<typeof nothing>(nothing),
        }));

        const element = await fixture<HTMLElement & { entity: RetailMediaResultPlacementResultEntity }>(html`
            <relewise-retail-media-tile
                .entity=${promotedProduct('async-unlabelled')}>
            </relewise-retail-media-tile>
        `);

        await new Promise(resolve => setTimeout(resolve, 0));
        assert.exists(element.shadowRoot?.querySelector('relewise-product-tile'));
        assert.isNull(element.shadowRoot?.querySelector('[part="sponsored-label"]'));
    });

    test('hides the sponsored wrapper when the product template resolves to nothing', async() => {
        const options = mockRelewiseOptions();
        options.templates = {
            product: () => Promise.resolve<typeof nothing>(nothing),
        };
        initializeRelewiseUI(options);
        useSearch();

        const element = await fixture<HTMLElement & { entity: RetailMediaResultPlacementResultEntity }>(html`
            <relewise-retail-media-tile
                .entity=${promotedProduct('hidden-sponsored')}>
            </relewise-retail-media-tile>
        `);

        await waitUntil(() => element.hidden);
        assert.isTrue(element.hidden);
    });

    test('uses custom sponsored-label and display-ad templates', async() => {
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch();
        useRetailMedia(builder => builder
            .variation({ key: 'Default', minWidth: 0 })
            .templates({
                retailMediaSponsoredLabel: (promoted, { html }) => html`<strong>${promoted.result.productId} partner</strong>`,
                retailMediaDisplayAd: (ad, { html }) => html`<a href="/campaign">${ad.result.name}</a>`,
            }));

        const sponsored = await fixture<HTMLElement & { entity: RetailMediaResultPlacementResultEntity }>(html`
            <relewise-retail-media-tile
                .entity=${promotedProduct('sponsored')}>
            </relewise-retail-media-tile>
        `);
        const ad = await fixture<HTMLElement & { entity: RetailMediaResultPlacementResultEntity }>(html`
            <relewise-retail-media-tile
                .entity=${displayAd('hero')}>
            </relewise-retail-media-tile>
        `);

        assert.equal(sponsored.shadowRoot?.querySelector('[part="sponsored-label"]')?.textContent?.trim(), 'sponsored partner');
        assert.equal(ad.shadowRoot?.querySelector('[part="display-ad"]')?.textContent?.trim(), 'Display ad hero');
        assert.isFalse(ad.hidden);
    });

    test('tracks display ad link clicks', async() => {
        const originalTrackDisplayAdClick = Tracker.prototype.trackDisplayAdClick;
        let trackedClick: Parameters<Tracker['trackDisplayAdClick']>[0] | undefined;
        Tracker.prototype.trackDisplayAdClick = async function(click) {
            trackedClick = click;
            return undefined as any;
        };

        try {
            initializeRelewiseUI(mockRelewiseOptions());
            useSearch();
            useRetailMedia(builder => builder
                .variation({ key: 'Default', minWidth: 0 })
                .templates({
                    retailMediaDisplayAd: (ad, { html }) => html`<a>${ad.result.name}</a>`,
                }));

            const element = await fixture<HTMLElement & {
                entity: RetailMediaResultPlacementResultEntity;
                user: { temporaryId: string };
            }>(html`
                <relewise-retail-media-tile
                    .entity=${displayAd('tracked')}
                    .user=${{ temporaryId: 'user' }}>
                </relewise-retail-media-tile>
            `);

            (element.shadowRoot?.querySelector('a') as HTMLAnchorElement).click();
            await waitUntil(() => trackedClick !== undefined);

            assert.deepEqual(trackedClick, {
                campaignId: 'campaign-tracked',
                displayAdId: 'tracked',
                user: { temporaryId: 'user' },
            });
        } finally {
            Tracker.prototype.trackDisplayAdClick = originalTrackDisplayAdClick;
        }
    });

    test('supports light DOM rendering', async() => {
        const options = mockRelewiseOptions();
        options.components = { domMode: 'light' };
        options.templates = {
            product: () => nothing,
        };
        initializeRelewiseUI(options);
        useSearch();
        useRetailMedia(builder => builder
            .variation({ key: 'Default', minWidth: 0 })
            .templates({
                retailMediaDisplayAd: (ad, { html }) => html`<span>${ad.result.name}</span>`,
            }));

        const element = await fixture<HTMLElement & { entity: RetailMediaResultPlacementResultEntity }>(html`
            <relewise-retail-media-tile
                .entity=${displayAd('light')}>
            </relewise-retail-media-tile>
        `);

        assert.isNull(element.shadowRoot);
        assert.equal(element.querySelector('[part="display-ad"]')?.textContent?.trim(), 'Display ad light');

        const sponsored = await fixture<HTMLElement & { entity: RetailMediaResultPlacementResultEntity }>(html`
            <relewise-retail-media-tile
                .entity=${promotedProduct('hidden-light')}>
            </relewise-retail-media-tile>
        `);
        await waitUntil(() => sponsored.hidden);
        assert.isTrue(sponsored.hidden);
    });
});
