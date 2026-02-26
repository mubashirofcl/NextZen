export const resolveEffectiveDiscount = (product) => {
    const now = new Date();

    // 1. Check Product Level
    if (product.offerId?.isActive && now <= product.offerId.endDate && now >= product.offerId.startDate) {
        return product.offerId.discountValue;
    }

    // 2. Check Sub-category Level
    const subCatOffer = product.subcategoryId?.offerId;
    if (subCatOffer?.isActive && now <= subCatOffer.endDate && now >= subCatOffer.startDate) {
        return subCatOffer.discountValue;
    }

    // 3. Check Category Level
    const catOffer = product.categoryId?.offerId;
    if (catOffer?.isActive && now <= catOffer.endDate && now >= catOffer.startDate) {
        return catOffer.discountValue;
    }

    return 0; 
};

/**
 * Calculates final prices for product variants
 */
export const applyOffersToProduct = (product) => {
    const discount = resolveEffectiveDiscount(product);

    if (discount === 0) return product;

    product.variants = product.variants.map(variant => ({
        ...variant,
        sizes: variant.sizes.map(size => {
            const original = Number(size.originalPrice);
            const calculatedSale = original - (original * (discount / 100));
            return {
                ...size,
                salePrice: Math.round(calculatedSale), 
                appliedDiscount: discount
            };
        })
    }));

    return product;
};