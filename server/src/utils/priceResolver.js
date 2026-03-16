export const resolveEffectiveDiscount = (product) => {
    const now = new Date();

    if (product.offerId?.isActive && now <= product.offerId.endDate && now >= product.offerId.startDate) {
        return product.offerId.discountValue;
    }

    const subCatOffer = product.subcategoryId?.offerId;
    if (subCatOffer?.isActive && now <= subCatOffer.endDate && now >= subCatOffer.startDate) {
        return subCatOffer.discountValue;
    }

    const catOffer = product.categoryId?.offerId;
    if (catOffer?.isActive && now <= catOffer.endDate && now >= catOffer.startDate) {
        return catOffer.discountValue;
    }

    return 0; 
};

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