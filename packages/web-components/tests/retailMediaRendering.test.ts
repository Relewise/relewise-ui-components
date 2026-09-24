import { assert, fixture, html, waitUntil } from '@open-wc/testing';
import { Tracker, type ProductResult, type RetailMediaResult, type RetailMediaResultPlacementResultEntity } from '@relewise/client';
import type { TemplateResult } from 'lit';
import { initializeRelewiseUI, useRetailMedia, useSearch } from '../src';
import type { RetailMediaTargetConfiguration } from '../src/builders/retailMediaBuilder';
import { getProductSearchRenderItems } from '../src/search/retailMediaRendering';
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

    test('uses custom sponsored-label and display-ad templates', async() => {
        initializeRelewiseUI(mockRelewiseOptions());
        useSearch();
        useRetailMedia(builder => builder
            .variation({ key: 'Default', minWidth: 0 })
            .templates({
                retailMediaSponsoredLabel: (promoted, { html }) => html`<strong>${promoted.result.productId} partner</strong>`,
                retailMediaDisplayAd: async(ad, { html }) => html`<a href="/campaign">${ad.result.name}</a>`,
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

        await new Promise(resolve => setTimeout(resolve, 0));
        assert.equal(sponsored.shadowRoot?.querySelector('[part="sponsored-label"]')?.textContent?.trim(), 'sponsored partner');
        assert.equal(ad.shadowRoot?.querySelector('[part="display-ad"]')?.textContent?.trim(), 'Display ad hero');
        assert.isFalse(ad.hidden);
    });

    test('shows a previously hidden display ad while its asynchronous template resolves', async() => {
        let resolveTemplate!: (template: TemplateResult<1>) => void;
        const template = new Promise<TemplateResult<1>>(resolve => {
            resolveTemplate = resolve;
        });

        initializeRelewiseUI(mockRelewiseOptions());
        useSearch();
        useRetailMedia(builder => builder.templates({
            retailMediaDisplayAd: () => template,
        }));

        const element = await fixture<HTMLElement & { entity: RetailMediaResultPlacementResultEntity }>(html`
            <relewise-retail-media-tile
                hidden
                .entity=${displayAd('async')}>
            </relewise-retail-media-tile>
        `);

        assert.isFalse(element.hidden);

        resolveTemplate(html`<span>Resolved display ad</span>` as TemplateResult<1>);
        await waitUntil(() => element.shadowRoot?.textContent?.includes('Resolved display ad') === true);
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
    });
});
