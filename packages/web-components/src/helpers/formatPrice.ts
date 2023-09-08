import { getRelewiseUIOptions } from './relewiseUIOptions';

export default function formatPrice(price: string | number | null | undefined): string | number | null | undefined {

    if (!price) {
        return '';
    }

    const contextSettings = getRelewiseUIOptions().contextSettings;
    try {
        return new Intl.NumberFormat(contextSettings.language, {
            style: 'currency',
            currency: contextSettings.currency,
        }).format(Number(price));
    } catch {
        return price;
    }
}