import { getRelewiseContextSettings } from '../initialize';

export default function formatPrice(price: string | number | null | undefined) {

    if (!price) {
        return '';
    }

    const contextSettings = getRelewiseContextSettings();
    try {
        return new Intl.NumberFormat(contextSettings.language, {
            style: 'currency',
            currency: contextSettings.currency,
        }).format(Number(price));
    } catch {
        return price;
    }
}