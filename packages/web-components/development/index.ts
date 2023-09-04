import { UserFactory } from '@relewise/client';
import { initializeRelewiseUI } from '../src/index';
import { nothing } from 'lit-html';

initializeRelewiseUI(
    {
        contextSettings: {
            getUser: () => {
                return UserFactory.anonymous();
            },
            language: import.meta.env.VITE_LANGUAGE,
            currency: import.meta.env.VITE_CURRENCY,
            displayedAtLocation: 'Relewise Web Components',
        },
        datasetId: import.meta.env.VITE_DATASET_ID,
        apiKey: import.meta.env.VITE_API_KEY,
        clientOptions: {
            serverUrl: import.meta.env.VITE_SERVER_URL,
        },
        templates: {
            product: (product, { html, helpers }) => {
                return html`
                    <div style="border:1px solid black;" class="tile">
                        <div style='height: 5rem'>
                            <h5>${product.displayName}</h5>
                            <span>${product.salesPrice} NOK</span>
                        </div>
                        <div>${helpers.formatPrice(product.salesPrice)}</div>
                        ${(product.data && 'ImageUrl' in product.data)
                            ? html`<div><img src=${product.data['ImageUrl'].value} /></div>`
                            : nothing}
                    </div>
            `;
            },
        },
    },
);