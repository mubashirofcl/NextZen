import variantModel from "../../admin/productManagement/variant.model.js";
import * as orderRepo from "./order.repository.js";
import cartModel from "../cart/cart.model.js";

export const processCODOrder = async (userId, orderPayload) => {
    const { addressId, items, totals, paymentMethod } = orderPayload;

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

    const orderData = {
        userId,
        addressId,
        orderNumber: `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        status: "pending",
        paymentMethod: paymentMethod || 'COD',

        subTotal: totals.subTotal || totals.totalAmount, 
        totalDiscount: totals.discount || totals.totalDiscount || 0, 
        deliveryCharge: totals.deliveryCharge || 0,
        totalAmount: totals.totalAmount,
        
        items: items.map(i => ({
            productId: i.productId,
            variantId: i.variantId,
            size: i.size,           
            quantity: i.quantity,
            price: i.price,
            originalPrice: i.originalPrice || i.mrp || i.price,
            totalAmount: i.price * i.quantity,
            status: "Placed"
        }))
    };

    const newOrder = await orderRepo.createOrder(orderData);
    await cartModel.findOneAndUpdate({ userId }, { items: [], subtotal: 0 });
    
    return newOrder;
};

export const fetchUserHistory = async (userId) => {
    return await orderRepo.findOrdersByUserId(userId);
};

export const fetchManifestDetails = async (orderId, userId) => {
    return await orderRepo.findOrderWithDetails(orderId, userId);
};