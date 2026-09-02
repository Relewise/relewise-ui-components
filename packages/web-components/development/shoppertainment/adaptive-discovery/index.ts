/// <reference types="vite/client" />

import { UserFactory } from '@relewise/client';
import { initializeRelewiseUI } from '../../../src';

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
}).useShoppertainment({
    adaptiveDiscovery: {
        minimumPageSize: 12,
        configure(builder) {
            builder
                .addComposition({
                    options: {
                        type: 'Product',
                        count: { lowerBoundInclusive: 1, upperBoundInclusive: 2 },
                    },
                })
                .addComposition({
                    options: {
                        type: 'Content',
                        name: 'featured-content',
                        count: { lowerBoundInclusive: 1, upperBoundInclusive: 1 },
                    },
                });
        },
        compositionTemplates: {
            'featured-content': (composition, { html, helpers }) => {
                const content = composition.content?.[0];
                if (!content) {
                    return helpers.nothing;
                }

                return html`
                    <a
                        href=${content.data?.Url?.value ?? ''}
                        style="grid-column: 1 / -1; padding: 2rem; color: inherit; background: #f3f0ff; border-radius: 0.5rem; text-decoration: none;"
                        @click=${() => helpers.trackContentClick(content)}>
                        <strong>Named composition:</strong> ${content.displayName}
                    </a>
                `;
            },
        },
    },
});
