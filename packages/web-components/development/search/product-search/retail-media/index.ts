/// <reference types="vite/client" />

import { UserFactory } from '@relewise/client';
import { initializeRelewiseUI } from '../../../../src/index';

initializeRelewiseUI({
    contextSettings: {
        getUser: () => UserFactory.anonymous(),
        language: import.meta.env.VITE_LANGUAGE,
        currency: import.meta.env.VITE_CURRENCY,
    },
    datasetId: import.meta.env.VITE_DATASET_ID,
    apiKey: import.meta.env.VITE_API_KEY,
    clientOptions: {
        serverUrl: import.meta.env.VITE_SERVER_URL,
    },
})
    .useSearch()
    .useRetailMedia(builder => builder
        .variation({ key: 'MOBILE', minWidth: 0 })
        .variation({ key: 'TABLET', minWidth: 768 })
        .variation({ key: 'DESKTOP', minWidth: 1024 })
        .selectedDisplayAdProperties({
            displayName: true,
            allData: true,
            clickedByUserInfo: false,
        })
        .templates({
            retailMediaSponsoredLabel: (_product, { html }) => html`
                <span style="font-weight: 600;">Sponsored</span>
            `,
            retailMediaDisplayAd: (displayAd, { html }) => html`
                <a
                    href="#retail-media-display-ad"
                    style="position: relative; align-items:center; border-radius: 8px;color:#fff;display:flex;height:100%;justify-content:center;text-align:center;text-decoration:none;">
                    <img src="${displayAd.result.data?.ImageUrl.value}" style="max-height: 100%; max-width: 100%; border-radius: 8px;" />
                    <strong style="position: absolute; bottom: 28px">${displayAd.result.data?.Title?.value ?? displayAd.result.name}</strong>
                </a>
            `,
        })
        .target('retail-media-product-search', target => target
            .location('WEB_COMPONENTS')
            .placement('TOP', placement => placement.beforeResults())
            .placement('GRID', placement => placement.atPosition({ position: 4 }))));
