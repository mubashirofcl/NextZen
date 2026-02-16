import Cart from "./cart.model.js";
import Variant from "../../admin/productManagement/variant.model.js";

// 🟢 ADD ITEM: Uses pure salePrice without tax considerations
export const addItemToCart = async (userId, { productId, variantId, size, quantity = 1 }) => {
    let cart = await Cart.findOne({ userId });
    if (!cart) cart = new Cart({ userId, items: [] });

    const itemIndex = cart.items.findIndex(item =>
        item.variantId.toString() === variantId.toString() && item.size === size
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
            unitPrice: sizeData.salePrice // Pure Sale Price
        });
    }
    return await cart.save();
};

// 🟢 GET USER CART: Simplified math (No Tax)
export const getUserCart = async (userId) => {
    const cart = await Cart.findOne({ userId })
        .populate('items.productId')
        .populate('items.variantId');

    if (!cart) return { items: [], subtotal: 0, totalMarketPrice: 0, totalDiscount: 0 };

    const processedItems = cart.items.map(item => {
        const product = item.productId;
        const variant = item.variantId;

        const safeName = product?.name || "Archive Item";
        const sizeData = variant?.sizes?.find(s => s.size === item.size);
        const stockAvailable = sizeData?.stock || 0;

        const exists = !!(product && variant && sizeData);
        const isLive = !!(exists && product.isActive && !product.isDeleted && !variant.isDeleted);
        const hasStock = stockAvailable >= item.quantity;

        const isReady = isLive && hasStock;

        let conflictMsg = null;
        if (!exists) {
            conflictMsg = "Item no longer exists in our collection.";
        } else if (!isLive) {
            conflictMsg = `${safeName} has been decommissioned.`;
        } else if (!hasStock) {
            conflictMsg = stockAvailable > 0
                ? `Only ${stockAvailable} left for ${safeName}.`
                : `${safeName} is out of stock.`;
        }

        return {
            ...item.toObject(),
            currentPrice: sizeData?.salePrice || 0,
            marketPrice: sizeData?.originalPrice || sizeData?.salePrice || 0,
            isCheckoutReady: isReady,
            errorMessage: conflictMsg
        };
    });

    // 🟢 Simplified Totals: Subtotal + Market Price Calculation
    // Only includes items that are ready for checkout
    const subtotal = processedItems.reduce((acc, i) => 
        i.isCheckoutReady ? acc + (i.currentPrice * i.quantity) : acc, 0
    );

    const totalMarketPrice = processedItems.reduce((acc, i) => 
        i.isCheckoutReady ? acc + (i.marketPrice * i.quantity) : acc, 0
    );

    return { 
        items: processedItems, 
        subtotal, 
        totalMarketPrice, 
        totalDiscount: totalMarketPrice - subtotal 
    };
};

// 🟢 UPDATE QUANTITY
export const updateItemQuantity = async (userId, itemId, action) => {
    const cart = await Cart.findOne({ userId });
    const item = cart.items.id(itemId);
    const variant = await Variant.findById(item.variantId);
    const sizeData = variant?.sizes.find(s => s.size === item.size);

    if (action === 'inc') {
        if (item.quantity >= 5) throw new Error("Maximum limit reached (5).");
        if (item.quantity >= (sizeData?.stock || 0)) throw new Error("Stock depleted.");
        item.quantity += 1;
    } else {
        if (item.quantity > 1) item.quantity -= 1;
    }
    return await cart.save();
};

// 🟢 REMOVE ITEM
export const removeItem = async (userId, itemId) => {
    return await Cart.findOneAndUpdate(
        { userId }, 
        { $pull: { items: { _id: itemId } } }, 
        { new: true }
    );
};

// 🟢 CLEAR CART
export const clearUserCart = async (userId) => {
    return await Cart.findOneAndUpdate(
        { userId }, 
        { $set: { items: [] } }, 
        { new: true }
    );
};