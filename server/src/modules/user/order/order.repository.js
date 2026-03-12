import mongoose from "mongoose";
import orderModel from "./order.model.js";

export const createOrder = async (orderData) => {
    return await orderModel.create(orderData);
};

export const findOrdersByUserId = async (userId, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    const [orders, totalOrders] = await Promise.all([
        orderModel.find({
            userId: new mongoose.Types.ObjectId(userId)
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('items.productId', 'name thumbnail images')
            .populate({
                path: 'items.variantId',
                select: 'images'
            }),
        orderModel.countDocuments({
            userId: new mongoose.Types.ObjectId(userId)
        })
    ]);

    return { orders, totalOrders, currentPage: page, totalPages: Math.ceil(totalOrders / limit) };
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