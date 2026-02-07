import * as orderRepo from "./order.repository.js";
import Variant from "../../admin/productManagement/variant.model.js";
import cartModel from "../cart/cart.model.js";

export const processCODOrder = async (userId, orderPayload) => {
    const { addressId, items, totals, paymentMethod } = orderPayload; // 1. Added paymentMethod

    // Atomic Stock Deduction
    for (const item of items) {
        const variant = await Variant.findOneAndUpdate(
            {
                _id: item.variantId,
                "sizes.size": item.size,
                "sizes.stock": { $gte: item.quantity }
            },
            { $inc: { "sizes.$.stock": -item.quantity } },
            { new: true }
        );

        if (!variant) throw new Error(`Inventory conflict: Item out of stock.`);
    }

    if (!items || items.length === 0) {
        throw new Error("Inventory Conflict: No available items to place an order.");
    }

    const orderData = {
        userId,
        addressId,
        orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        status: "pending",
        paymentMethod: paymentMethod || 'cashOnDelivery',
        deliveryCharge: totals.deliveryCharge || 0,
        totalMarketPrice: totals.totalMarketPrice || 0, 
        totalDiscount: totals.totalDiscount || 0,       
        totalAmount: totals.totalAmount,
        items: items.map(i => ({
            productId: i.productId,
            variantId: i.variantId,
            size: i.size,           
            quantity: i.quantity,
            price: i.price,
            totalAmount: i.price * i.quantity
        }))
    };

    const newOrder = await orderRepo.createOrder(orderData);

    // Purge Cart
    await cartModel.findOneAndUpdate({ userId }, { items: [], subtotal: 0 });

    return newOrder;
};

export const fetchUserHistory = async (userId) => {
    return await orderRepo.findOrdersByUserId(userId);
};

export const fetchManifestDetails = async (orderId, userId) => {
    return await orderRepo.findOrderWithDetails(orderId, userId);
};