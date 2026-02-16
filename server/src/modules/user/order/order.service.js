import variantModel from "../../admin/productManagement/variant.model.js";
import * as orderRepo from "./order.repository.js";
import cartModel from "../cart/cart.model.js";

export const processCODOrder = async (userId, orderPayload) => {
    const { addressId, items, totals, paymentMethod } = orderPayload;

    // 1. Inventory Check & Update
    for (const item of items) {
        const variant = await variantModel.findOneAndUpdate(
            {
                _id: item.variantId,
                "sizes.size": item.size,
                "sizes.stock": { $gte: item.quantity }
            },
            { $inc: { "sizes.$.stock": -item.quantity } },
            { new: true }
        );
        if (!variant) throw new Error(`Inventory conflict: ${item.size} out of stock.`);
    }

    // 2. 🟢 Process Items (Tax Removed)
    const processedItems = items.map(i => {
        const productBaseTotal = i.price * i.quantity;

        return {
            productId: i.productId,
            variantId: i.variantId,
            size: i.size,
            quantity: i.quantity,
            price: i.price,
            originalPrice: i.originalPrice || i.price,
            // 🟢 totalAmount is now just the base total
            totalAmount: productBaseTotal,
            status: "Placed"
        };
    });

    // 3. 🟢 Order Data (Simplified Math)
    const subTotal = items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const deliveryCharge = totals.deliveryCharge || 0;
    const totalDiscount = totals.totalDiscount || 0;

    const orderData = {
        userId,
        addressId,
        orderNumber: `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        status: "pending",
        paymentMethod: paymentMethod || 'COD',
        subTotal: subTotal,
        totalDiscount: totalDiscount,
        deliveryCharge: deliveryCharge,
        // 🟢 Final Total = Subtotal + Delivery - Discount
        totalAmount: subTotal + deliveryCharge - totalDiscount,
        items: processedItems
    };

    const newOrder = await orderRepo.createOrder(orderData);

    // Clear cart after successful placement
    await cartModel.findOneAndUpdate({ userId }, { items: [], subtotal: 0 });

    return newOrder;
};

export const fetchUserHistory = async (userId) => {
    return await orderRepo.findOrdersByUserId(userId);
};

export const fetchManifestDetails = async (orderId, userId) => {
    return await orderRepo.findOrderWithDetails(orderId, userId);
};