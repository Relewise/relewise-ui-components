export type ProductAndVariantId = { productId: string; variantId?: string };

export function extractProductAndVariantIds(el: Element): ProductAndVariantId[] {
    const productAndVariantElements = el.querySelectorAll('product-and-variant-id');
    const productAndVariantIds: ProductAndVariantId[] = [];

    productAndVariantElements.forEach(element => {
        const productId = element.getAttribute('product-id');
        if (productId) {
            const variantId = element.getAttribute('variant-id') ?? undefined;
            productAndVariantIds.push({ productId, variantId });
        }
    });
    
    return productAndVariantIds;
}