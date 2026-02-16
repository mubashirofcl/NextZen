import mongoose from "mongoose";
import orderModel from "./order.model.js";

export const createOrder = async (orderData) => {
    return await orderModel.create(orderData);
};

export const findOrdersByUserId = async (userId) => {
    return await orderModel.find({
        userId: new mongoose.Types.ObjectId(userId)
    })
        .sort({ createdAt: -1 })
        .populate('items.productId', 'name thumbnail images')
        .populate({
            path: 'items.variantId',
            select: 'images'
        });
};

export const findOrderWithDetails = async (orderId, userId) => {
    return await orderModel.findOne({
        _id: new mongoose.Types.ObjectId(orderId),
        userId: new mongoose.Types.ObjectId(userId)
    })
        .populate('items.productId')
        .populate('items.variantId')
        .populate('addressId');
};