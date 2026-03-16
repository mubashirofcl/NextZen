import Cart from "./cart.model.js";
import Wishlist from "../Wishlist/wishlist.model.js";
import Product from "../../admin/productManagement/product.model.js";
import Variant from "../../admin/productManagement/variant.model.js";

export const addItemToCart = async (userId, { productId, variantId, size, quantity = 1 }) => {
    let cart = await Cart.findOne({ userId });
    if (!cart) cart = new Cart({ userId, items: [] });

    const itemIndex = cart.items.findIndex(item =>
        item.variantId.toString() === variantId.toString() &&
        item.size === size
    );

    if (itemIndex > -1) {
        const newQty = cart.items[itemIndex].quantity + Number(quantity);
        if (newQty > 5) throw new Error("Maximum 5 units allowed per item.");
        cart.items[itemIndex].quantity = newQty;
    } else {
        const variant = await Variant.findById(variantId);
        const sizeData = variant?.sizes.find(s => s.size === size);

        if (!sizeData || sizeData.stock < 1) throw new Error("Size out of stock.");

        cart.items.push({
            productId,
            variantId,
            size,
            quantity,
            unitPrice: sizeData.salePrice 
        });
    }

    return await cart.save();
};

export const getUserCart = async (userId) => {
    const cart = await Cart.findOne({ userId })
        .populate('items.productId')
        .populate('items.variantId');

    if (!cart) return { items: [], subtotal: 0, totalMarketPrice: 0, totalDiscount: 0 };

    const processedItems = cart.items.map(item => {
        const product = item.productId;
        const variant = item.variantId;

        const isProductLive = !!(product && product.isActive && !product.isDeleted);
        const isVariantLive = !!(variant && !variant.isDeleted);

        const sizeData = variant?.sizes?.find(s => s.size === item.size);
        const stockAvailable = sizeData?.stock || 0;
        const hasStock = stockAvailable >= item.quantity;

        const readyForCheckout = isProductLive && isVariantLive && hasStock;

        const itemPrice = sizeData?.salePrice || 0;
        const marketPrice = sizeData?.originalPrice || sizeData?.salePrice || 0;

        return {
            ...item.toObject(),
            currentPrice: itemPrice,
            marketPrice: marketPrice,
            currentStock: stockAvailable,
            isCheckoutReady: readyForCheckout,
            errorMessage: !isProductLive || !isVariantLive
                ? "Item decommissioned from archive."
                : !hasStock ? `Archive depleted (${stockAvailable} left).` : null
        };
    });

    const subtotal = processedItems.reduce((acc, i) => {
        return i.isCheckoutReady ? acc + (i.currentPrice * i.quantity) : acc;
    }, 0);

    const totalMarketPrice = processedItems.reduce((acc, i) => {
        return i.isCheckoutReady ? acc + (i.marketPrice * i.quantity) : acc;
    }, 0);

    return {
        items: processedItems,
        subtotal,
        totalMarketPrice,
        totalDiscount: totalMarketPrice - subtotal
    };
};

export const removeItem = async (userId, itemId) => {
    const cart = await Cart.findOne({ userId });
    const item = cart?.items.id(itemId);

    if (!item) return { success: true };

    await Cart.findOneAndUpdate(
        { userId },
        { $pull: { items: { _id: itemId } } }
    );

    return { success: true };
};

export const clearUserCart = async (userId) => {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
        return { items: [], subtotal: 0 };
    }

    cart.items = [];
    await cart.save();

    return { items: [], subtotal: 0 };
};