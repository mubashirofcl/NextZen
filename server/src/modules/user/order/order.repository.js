import Order from "./order.model.js";

export const createOrder = async (orderData) => {
    return await Order.create(orderData);
};

export const findOrdersByUserId = async (userId) => {
    return await Order.find({ userId })
        .populate('items.productId', 'name') // Added to get names in the list view
        .populate({
            path: 'items.variantId',
            select: 'images'
        })
        .sort({ createdAt: -1 });
};

export const findOrderWithDetails = async (orderId, userId) => {
    return await Order.findOne({ _id: orderId, userId })
        .populate('items.productId') // Full product details
        .populate('items.variantId') // Full variant details (images, etc)
        .populate('addressId');      // Full shipping details
};