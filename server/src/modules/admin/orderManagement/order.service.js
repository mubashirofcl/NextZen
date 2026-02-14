import * as orderRepository from './order.repository.js';
import orderModel from '../../user/order/order.model.js';

export const updateOrderStatus = async (orderId, newStatus) => {
    const order = await orderModel.findById(orderId);
    if (!order) throw new Error("Order manifest not found.");

    if (order.status === 'delivered' || order.status === 'cancelled') {
        throw new Error(`Cannot change status from ${order.status}`);
    }

    order.status = newStatus;

    if (newStatus === 'delivered' && order.paymentMethod === 'COD') {
        order.paymentStatus = 'paid';
    }

    return await order.save();
};