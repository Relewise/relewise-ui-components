/// <reference types="vite/client" />

import { UserFactory, ContentResult } from '@relewise/client';
import { ContentTemplateExtensions, initializeRelewiseUI } from '../../../src';

initializeRelewiseUI(
    {
        contextSettings: {
            getUser: () => {
                return UserFactory.anonymous();
            },
            language: import.meta.env.VITE_LANGUAGE,
            currency: import.meta.env.VITE_CURRENCY,
        },
        datasetId: import.meta.env.VITE_DATASET_ID,
        apiKey: import.meta.env.VITE_API_KEY,
        clientOptions: {
            serverUrl: import.meta.env.VITE_SERVER_URL,
        },
        selectedPropertiesSettings: {
            content: {
                displayName: true,
                allData: true,
            },
        },
        templates: {
            content: (content: ContentResult, { html }: ContentTemplateExtensions) => {
                const image = content.data && 'ImageUrl' in content.data ? content.data['ImageUrl'].value : null;
                const summary = content.data && 'Summary' in content.data ? content.data['Summary'].value : null;

                return html`
                    <div class="rw-image-container">
                        ${image
                            ? html`<img class="rw-object-cover" src=${image} alt=${content.displayName} style="height:200px;"/>`
                            : null}
                    </div>
                    <div class='rw-information-container'>
                        <h5 class='rw-display-name'>${content.displayName}</h5>
                        ${summary ? html`<p class="rw-summary">${summary}</p>` : null}
                    </div>`;

            },
        },
    },
).useRecommendations();
