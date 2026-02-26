import variantModel from "../../admin/productManagement/variant.model.js";
import * as orderRepo from "./order.repository.js";
import cartModel from "../cart/cart.model.js";
import couponModel from "../../admin/couponManagemen/coupon.model.js";

const sanitizeAmount = (amount) => Math.round((amount + Number.EPSILON) * 100) / 100;

export const processCODOrder = async (userId, orderPayload) => {
    
    const { addressId, items, totals, paymentMethod, couponCode } = orderPayload;

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

    const processedItems = items.map(i => {
        const productBaseTotal = sanitizeAmount(i.price * i.quantity);
        return {
            productId: i.productId,
            variantId: i.variantId,
            size: i.size,
            quantity: i.quantity,
            price: i.price,
            originalPrice: i.originalPrice || i.price,
            totalAmount: productBaseTotal,
            status: "Placed"
        };
    });

    const rawSubTotal = items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const subTotal = sanitizeAmount(rawSubTotal);
    
    const deliveryCharge = totals.deliveryCharge || 0;

    let discountAmount = 0;
    if (couponCode) {
        const coupon = await couponModel.findOne({ code: couponCode, isActive: true });
        if (coupon) {
            const now = new Date();
            if (coupon.endDate >= now && subTotal >= coupon.minPurchaseAmt) {
                if (coupon.discountType === 'PERCENT') {
                    discountAmount = sanitizeAmount((subTotal * coupon.discountValue) / 100);
                    if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
                } else {
                    discountAmount = coupon.discountValue;
                }

                await couponModel.updateOne({ _id: coupon._id }, { $inc: { usedCount: 1 } });
            }
        }
    }

    const totalAmount = Math.max(0, sanitizeAmount((subTotal + deliveryCharge) - discountAmount));

    const orderData = {
        userId,
        addressId,
        orderNumber: `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        status: "pending",
        paymentMethod: paymentMethod || 'COD',
        subTotal: subTotal,
        totalDiscount: totals.totalDiscount || 0, 
        couponCode: couponCode || null, 
        couponDiscount: discountAmount, 
        deliveryCharge: deliveryCharge,
        totalAmount: totalAmount,
        items: processedItems
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