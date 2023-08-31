import { getRelewiseContextSettings } from './relewiseUI';

export default function renderPrice(price: string | number | null | undefined) {
    const contextSettings = getRelewiseContextSettings();

    if (!price) {
        return '';
    }
  
    try {
        return new Intl.NumberFormat(contextSettings.language, {
            style: 'currency',
            currency: contextSettings.currency,
        }).format(Number(price));
    } catch {
        return price;
    }
}